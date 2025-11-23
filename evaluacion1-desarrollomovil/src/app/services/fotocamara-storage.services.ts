import {Injectable} from '@angular/core';
import {Preferences} from '@capacitor/preferences';

// Interfaz camara que representa la estructura de datos a almacenar 
export interface FotoCamara {
    id? : number;
    nombreArchivo: string;
    rutaArchivo: string;
    fechaCaptura: Date;
    base64Data?: string;
}

@Injectable({
    providedIn: 'root'
})

export class FotocamaraStorageService {
    private storageKey = 'fotos_camara'; // Clave para almacenar las fotos en Preferences
    // Metodo privado: generar clave de almacenamiento unica por usuario
    private getStorageKey(usuario: string): string {
        return `${this.storageKey}_${usuario}`;
    }
    // Metodo publico: guardar foto
    async guardarFoto(usuario: string, foto: Object): Promise<void> {
        const key = this.getStorageKey(usuario);
        await Preferences.set({
            key: key,
            value: JSON.stringify(foto)
        });
    }
    // Metodo: obtener foto de camara
    async obtenerFoto(usuario: string): Promise<FotoCamara[]> {
        const key = this.getStorageKey(usuario);
        const {value} = await Preferences.get({key: key});
        return value ? JSON.parse(value) : [];
    }
    // Metodo: eliminar foto 
    async eliminarFoto(usuario: string): Promise<void> {
        const key = this.getStorageKey(usuario);
        await Preferences.remove({key: key});
    }
}
