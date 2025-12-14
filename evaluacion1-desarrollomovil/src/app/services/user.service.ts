import { Injectable, inject } from '@angular/core';
import { Database, ref, push, set, onValue, get } from '@angular/fire/database';
import { Observable, firstValueFrom } from 'rxjs';
import * as CryptoJS from 'crypto-js';

export interface AppUser {
  id?: string;
  name: string;
  email: string;
  passwordHash: string; // SHA-256 hex
  rol: 'user' | 'admin'; // Rol del usuario
  geolocalizacion?: {
    latitud: number;
    longitud: number;
    fechaRegistro: string;
  };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private database = inject(Database);
  private usersCache: AppUser[] = [];
  private usersLoaded = false;

  constructor() {
    // Cargar usuarios en caché al iniciar
    this.obtenerUsuarios().subscribe(users => {
      this.usersCache = users;
      this.usersLoaded = true;
    });
  }

  obtenerUsuarios(): Observable<AppUser[]> {
    return new Observable<AppUser[]>((observer) => {
      const usuariosRef = ref(this.database, 'usuarios');
      onValue(usuariosRef, (snapshot) => {
        const usuarios: AppUser[] = [];
        snapshot.forEach((childSnapshot) => {
          const usuario: AppUser = childSnapshot.val();
          usuario.id = childSnapshot.key!;
          usuarios.push(usuario);
        });
        observer.next(usuarios);
      });
    });
  }

  list(): AppUser[] {
    return this.usersCache.slice();
  }

  private async findByEmailFromFirebase(email: string): Promise<AppUser | undefined> {
    try {
      if (!email || email.trim() === '') {
        console.log('Email vacío, no se puede buscar');
        return undefined;
      }

      const usuariosRef = ref(this.database, 'usuarios');
      const snapshot = await get(usuariosRef);
      
      if (!snapshot.exists()) {
        console.log('No hay usuarios en la base de datos');
        return undefined;
      }
      
      let userFound: AppUser | undefined = undefined;
      snapshot.forEach((childSnapshot) => {
        const usuario: AppUser = childSnapshot.val();
        if (usuario && usuario.email && usuario.email.toLowerCase() === email.toLowerCase()) {
          usuario.id = childSnapshot.key!;
          userFound = usuario;
          return true; // Detener iteración
        }
        return false;
      });
      
      if (!userFound) {
        console.log('Usuario no encontrado para email:', email);
      }
      
      return userFound;
    } catch (error) {
      console.error('Error al buscar usuario en Firebase:', error);
      return undefined;
    }
  }

  async register(
    name: string, 
    email: string, 
    password: string, 
    geolocalizacion?: { latitud: number; longitud: number },
    rol?: 'user' | 'admin'
  ): Promise<{ ok: boolean; reason?: string; user?: AppUser }> {
    email = (email || '').trim();
    if (!email) return { ok: false, reason: 'Email requerido' };
    
    // Verificar si el email ya existe en Firebase
    const existingUser = await this.findByEmailFromFirebase(email);
    if (existingUser) return { ok: false, reason: 'Email ya registrado' };
    
    const hash = await this.hashPassword(password || '');
    
    try {
      const usuariosRef = ref(this.database, 'usuarios');
      
      // Verificar si es el primer usuario (será admin automáticamente)
      const snapshot = await get(usuariosRef);
      const esPrimerUsuario = !snapshot.exists() || snapshot.size === 0;
      
      // Asignar rol: admin si es primer usuario o si se especifica, sino 'user'
      const rolAsignado = esPrimerUsuario ? 'admin' : (rol || 'user');
      
      const newUsuarioRef = push(usuariosRef);
      
      const usuario: AppUser = {
        id: newUsuarioRef.key!,
        name: (name || '').trim(),
        email,
        passwordHash: hash,
        rol: rolAsignado,
        geolocalizacion: geolocalizacion ? {
          latitud: geolocalizacion.latitud,
          longitud: geolocalizacion.longitud,
          fechaRegistro: new Date().toISOString()
        } : undefined
      };
      
      await set(newUsuarioRef, {
        name: usuario.name,
        email: usuario.email,
        passwordHash: usuario.passwordHash,
        rol: usuario.rol,
        ...(usuario.geolocalizacion && { geolocalizacion: usuario.geolocalizacion })
      });
      
      console.log(`Usuario registrado con rol: ${rolAsignado}${esPrimerUsuario ? ' (primer usuario)' : ''}`);
      
      return { ok: true, user: usuario };
    } catch (error) {
      console.error('Error al registrar usuario en Firebase:', error);
      return { ok: false, reason: 'Error al guardar en la base de datos' };
    }
  }

  async validateCredentials(email: string, password: string): Promise<{ ok: boolean; user?: AppUser }> {
    try {
      // Validar que se proporcionen email y password
      if (!email || !password || email.trim() === '' || password.trim() === '') {
        console.log('Email o password vacíos');
        return { ok: false };
      }

      // Buscar usuario directamente en Firebase para asegurar datos actualizados
      const user = await this.findByEmailFromFirebase(email.trim());
      
      if (!user) {
        console.log('Usuario no encontrado');
        return { ok: false };
      }
      
      // Comparar contraseña usando bcrypt
      const isPasswordValid = await this.comparePassword(password, user.passwordHash);
      
      if (isPasswordValid) {
        console.log(`Credenciales válidas - Rol: ${user.rol}`);
        return { ok: true, user };
      }
      
      console.log('Contraseña incorrecta');
      return { ok: false };
    } catch (error) {
      console.error('Error al validar credenciales:', error);
      return { ok: false };
    }
  }

  // Verificar si un usuario es admin
  isAdmin(user: AppUser | undefined | null): boolean {
    return user?.rol === 'admin';
  }

  // Verificar si un usuario es user regular
  isUser(user: AppUser | undefined | null): boolean {
    return user?.rol === 'user';
  }

  // Actualizar rol de un usuario (solo admin puede hacer esto)
  async updateUserRole(userId: string, newRole: 'user' | 'admin'): Promise<{ ok: boolean; reason?: string }> {
    try {
      const usuarioRef = ref(this.database, `usuarios/${userId}`);
      const snapshot = await get(usuarioRef);
      
      if (!snapshot.exists()) {
        return { ok: false, reason: 'Usuario no encontrado' };
      }

      await set(ref(this.database, `usuarios/${userId}/rol`), newRole);
      console.log(`Rol actualizado para usuario ${userId}: ${newRole}`);
      
      return { ok: true };
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      return { ok: false, reason: 'Error al actualizar en la base de datos' };
    }
  }

  // Usar CryptoJS (SHA256) para hashear contraseñas - funciona en navegadores móviles
  private async hashPassword(password: string): Promise<string> {
    // SHA-256 hash usando CryptoJS
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
  }

  // Comparar contraseña con hash (comparación directa de hashes)
  async comparePassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }
}
