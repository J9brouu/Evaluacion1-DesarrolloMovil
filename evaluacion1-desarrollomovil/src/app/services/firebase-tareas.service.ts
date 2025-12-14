import {Injectable} from '@angular/core';
import {Database, ref, push, set, onValue, remove} from '@angular/fire/database';
import {Observable} from 'rxjs';

export interface Detalle {
    id?: string;
    titulo: string;
    plataforma: string;
    genero: string;
    anio: number;
    precio: number;
    portada: string;
}

@Injectable({
    providedIn: 'root'
})
export class FirebaseTareasService {
    constructor(private database: Database) {}

    agregarDetalle(detalle: Detalle): Promise<void> {
        const detallesRef = ref(this.database, 'detalles');
        const newDetalleRef = push(detallesRef);
        detalle.id = newDetalleRef.key!;
        return set(newDetalleRef, detalle);
    }
   
    obtenerDetalles(): Observable<Detalle[]> {
        return new Observable<Detalle[]>((observer) => {
            const detallesRef = ref(this.database, 'detalles');
            onValue(detallesRef, (snapshot) => {
                const detalles: Detalle[] = [];
                snapshot.forEach((childSnapshot) => {
                    const detalle: Detalle = childSnapshot.val();
                    detalle.id = childSnapshot.key!;
                    detalles.push(detalle);
                });
                observer.next(detalles);
            });
        });
    }

    actualizarDetalle(detalle: Detalle): Promise<void> {
        if (!detalle.id) {
            return Promise.reject('El detalle debe tener un ID para ser actualizado.');
        }
        const detalleRef = ref(this.database, `detalles/${detalle.id}`);
        return set(detalleRef, detalle);
    }

    eliminarDetalle(id: string): Promise<void> {
        const detalleRef = ref(this.database, `detalles/${id}`);
        return remove(detalleRef);
    }

}

