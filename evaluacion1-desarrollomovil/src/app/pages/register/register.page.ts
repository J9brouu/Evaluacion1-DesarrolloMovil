import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, LoadingController, ToastController, AlertController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonButton,
  IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline, eye, eyeOff, logoGoogle, logoFacebook, personCircleOutline, mailOutline, lockOpenOutline } from 'ionicons/icons';
import { UserService } from '../../services/user.service';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonIcon, IonButton, IonNote, CommonModule, FormsModule, ReactiveFormsModule]
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private userSvc: UserService
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agree: [true]
    });

    addIcons({
      'personOutline': personOutline,
      'lockClosedOutline': lockClosedOutline,
      'eye': eye,
      'eyeOff': eyeOff,
      'logoGoogle': logoGoogle,
      'logoFacebook': logoFacebook,
      'personCircleOutline': personCircleOutline,
      'mailOutline': mailOutline,
      'lockOpenOutline': lockOpenOutline
    });
  }


  socialLogin(provider: 'google' | 'facebook') {
    this.toastCtrl.create({ message: `Login social con ${provider} (simulado)`, duration: 1500 }).then(t => t.present());
  }
  ngOnInit() {}

  get name() { return this.registerForm.get('name')!; }
  get email() { return this.registerForm.get('email')!; }
  get password() { return this.registerForm.get('password')!; }
  get confirmPassword() { return this.registerForm.get('confirmPassword')!; }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
    const pwd = document.querySelector('input[formControlName="password"]') as HTMLInputElement | null;
    if (pwd) {
      setTimeout(() => {
        try {
          const len = pwd.value ? pwd.value.length : 0;
          pwd.focus();
          if (typeof pwd.setSelectionRange === 'function') {
            pwd.setSelectionRange(len, len);
          }
        } catch (e) {}
      }, 0);
    }
  }

  async register() {
    // Llamar al método que pide geolocalización
    await this.registrarEnFirebase();
  }

  goToLogin() {
    this.navCtrl.navigateBack('/login');
  }

  validarFormulario(): boolean {
    if (this.registerForm.invalid) {
      this.name.markAsTouched();
      this.email.markAsTouched();
      this.password.markAsTouched();
      this.confirmPassword.markAsTouched();
      return false;
    }

    if (this.password.value !== this.confirmPassword.value) {
      return false;
    }

    return true;
  }

  async obtenerGeolocalizacion(): Promise<{ latitud: number; longitud: number } | null> {
    try {
      const permiso = await Geolocation.checkPermissions();
      
      if (permiso.location !== 'granted') {
        const solicitud = await Geolocation.requestPermissions();
        if (solicitud.location !== 'granted') {
          console.log('Permiso de geolocalización denegado');
          return null;
        }
      }

      const posicion = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      return {
        latitud: posicion.coords.latitude,
        longitud: posicion.coords.longitude
      };
    } catch (error) {
      console.error('Error al obtener geolocalización:', error);
      return null;
    }
  }

  async registrarEnFirebase() {
    if (!this.validarFormulario()) {
      const t = await this.toastCtrl.create({ 
        message: 'Por favor completa correctamente todos los campos', 
        duration: 1800, 
        color: 'warning' 
      });
      await t.present();
      return;
    }

    if (this.password.value !== this.confirmPassword.value) {
      const t = await this.toastCtrl.create({ 
        message: 'Las contraseñas no coinciden', 
        duration: 2000, 
        color: 'danger' 
      });
      await t.present();
      return;
    }

    // Solicitar geolocalización
    const alert = await this.alertCtrl.create({
      header: 'Ubicación',
      message: 'Para completar tu registro, necesitamos acceder a tu ubicación. ¿Deseas permitirlo?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          handler: async () => {
            const t = await this.toastCtrl.create({ 
              message: 'Registro continúa sin ubicación', 
              duration: 1500, 
              color: 'warning' 
            });
            await t.present();
            await this.continuarRegistro(null);
          }
        },
        {
          text: 'Sí',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Obteniendo ubicación...' });
            await loading.present();
            
            const geo = await this.obtenerGeolocalizacion();
            await loading.dismiss();
            
            if (geo) {
              const t = await this.toastCtrl.create({ 
                message: 'Ubicación obtenida correctamente', 
                duration: 1200, 
                color: 'success' 
              });
              await t.present();
            } else {
              const t = await this.toastCtrl.create({ 
                message: 'No se pudo obtener la ubicación, continuando sin ella', 
                duration: 1800, 
                color: 'warning' 
              });
              await t.present();
            }
            
            await this.continuarRegistro(geo);
          }
        }
      ]
    });

    await alert.present();
  }

  private async continuarRegistro(geolocalizacion: { latitud: number; longitud: number } | null) {
    const loading = await this.loadingCtrl.create({ message: 'Registrando usuario en Firebase...' });
    await loading.present();

    try {
      const name = this.registerForm.value.name;
      const email = this.registerForm.value.email;
      const password = this.registerForm.value.password;

      const res = await this.userSvc.register(name, email, password, geolocalizacion || undefined);

      await loading.dismiss();

      if (!res.ok) {
        const t = await this.toastCtrl.create({ 
          message: `Error: ${res.reason}`, 
          duration: 1800, 
          color: 'danger' 
        });
        await t.present();
        return;
      }

      const mensaje = geolocalizacion 
        ? `Usuario registrado exitosamente con ubicación (${geolocalizacion.latitud.toFixed(4)}, ${geolocalizacion.longitud.toFixed(4)})`
        : 'Usuario registrado exitosamente';

      const t = await this.toastCtrl.create({ 
        message: mensaje, 
        duration: 2000, 
        color: 'success' 
      });
      await t.present();

      this.navCtrl.navigateBack(['/login']);
    } catch (error) {
      await loading.dismiss();
      console.error('Error al registrar en Firebase:', error);
      const t = await this.toastCtrl.create({ 
        message: 'Error al registrar usuario', 
        duration: 1800, 
        color: 'danger' 
      });
      await t.present();
    }
  }
}
