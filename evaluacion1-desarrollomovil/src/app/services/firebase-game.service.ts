import { Injectable, inject } from '@angular/core';
import { Database, ref, push, set, onValue, remove, get } from '@angular/fire/database';
import { Observable } from 'rxjs';

export interface Game {
  id?: string;
  title: string;
  platform: string;
  genre?: string;
  year?: number;
  price?: number;
  cover?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseGameService {
  private database = inject(Database);

  constructor() {}

  agregarJuego(juego: Game): Promise<void> {
    const juegosRef = ref(this.database, 'juegos');
    const newJuegoRef = push(juegosRef);
    juego.id = newJuegoRef.key!;
    return set(newJuegoRef, juego);
  }

  obtenerJuegos(): Observable<Game[]> {
    return new Observable<Game[]>((observer) => {
      const juegosRef = ref(this.database, 'juegos');
      onValue(juegosRef, (snapshot) => {
        const juegos: Game[] = [];
        snapshot.forEach((childSnapshot) => {
          const juego: Game = childSnapshot.val();
          juego.id = childSnapshot.key!;
          juegos.push(juego);
        });
        observer.next(juegos);
      });
    });
  }

  actualizarJuego(juego: Game): Promise<void> {
    if (!juego.id) {
      return Promise.reject('El juego debe tener un ID para ser actualizado.');
    }
    const juegoRef = ref(this.database, `juegos/${juego.id}`);
    return set(juegoRef, juego);
  }

  eliminarJuego(id: string): Promise<void> {
    const juegoRef = ref(this.database, `juegos/${id}`);
    return remove(juegoRef);
  }

  async obtenerJuegoPorId(id: string): Promise<Game | null> {
    try {
      const juegoRef = ref(this.database, `juegos/${id}`);
      const snapshot = await get(juegoRef);
      
      if (snapshot.exists()) {
        const juego: Game = snapshot.val();
        juego.id = snapshot.key!;
        return juego;
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener juego por ID:', error);
      return null;
    }
  }
}
