import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonSpinner, IonCard, IonButton, IonChip } from '@ionic/angular/standalone';
import { NavController, ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

interface Usuario {
  id: number;
  rut: string;
  nombre: string;
  apellido: string;
  password: string;
  email: string;
  rol: string;
  avatarUrl?: string;
}


@Component({
  selector: 'app-testapi',
  templateUrl: './testapi.page.html',
  styleUrls: ['./testapi.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonLabel, IonSpinner, IonCard, IonButton, IonChip],
})
export class TestapiPage implements OnInit {

  usuarios: Usuario[] = [];
  cargando: boolean = false;

  constructor(private http: HttpClient, private navCtrl: NavController, private toastCtrl: ToastController) { }

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargando = true;
    const apiUrl = 'http://localhost:8080/user/json'; // Reemplaza con la URL real de tu API
    this.http.get<Usuario[]>(apiUrl).subscribe({
      next: (respuesta) => {
        this.usuarios = respuesta;
        this.cargando = false;
        console.log('Usuarios cargados:', this.usuarios);
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.cargando = false;
      }
    });
  }

  verDetalle(usuario: Usuario) {
    // Navega a la página de detalle o muestra un toast (aquí solo mostramos info rápida)
    this.toastCtrl.create({ message: `Ver detalle: ${usuario.nombre} ${usuario.apellido}`, duration: 1200 }).then(t => t.present());
    // Ejemplo de navegación si tienes una ruta de detalle: this.navCtrl.navigateForward(['/detalle'], { state: { user: usuario } });
  }

  editarUsuario(usuario: Usuario) {
    this.toastCtrl.create({ message: `Editar usuario: ${usuario.nombre}`, duration: 1200 }).then(t => t.present());
    // aquí podrías abrir un modal o navegar a una ruta de edición
  }
}
