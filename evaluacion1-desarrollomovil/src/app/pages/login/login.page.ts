import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NavController, LoadingController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonItem,
  IonIcon,
  IonButton,
  IonNote,
  IonCheckbox,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline, eye, eyeOff, logoGoogle, logoFacebook} from 'ionicons/icons';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
  IonContent,
  IonHeader,
  IonItem,
    IonIcon,
    IonButton,
    IonNote,
    IonCheckbox,
    IonLabel,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
    , private userSvc: UserService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });
    addIcons({
        'personOutline': personOutline,
        'lockClosedOutline': lockClosedOutline,
        'eye': eye,
        'eyeOff': eyeOff,
        'logoGoogle': logoGoogle,
        'logoFacebook': logoFacebook
      }); // Agrega iconos si es necesario

  }

  // getters para acceso rápido en la plantilla
  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  ngOnInit(): void {}

  toggleShowPassword() {
    // Toggle flag
    this.showPassword = !this.showPassword;

    // After toggling the input type, restore focus to the password field
    // and move caret to the end so the user can continue typing naturally.
    const pwd = document.querySelector('input[formControlName="password"]') as HTMLInputElement | null;
    if (pwd) {
      // Use a small timeout to ensure the DOM updates the input type before focusing
      setTimeout(() => {
        try {
          const len = pwd.value ? pwd.value.length : 0;
          pwd.focus();
          // setSelectionRange may throw on some browsers if input is not focusable yet
          if (typeof pwd.setSelectionRange === 'function') {
            pwd.setSelectionRange(len, len);
          }
        } catch (e) {
          // ignore focus errors
        }
      }, 0);
    }
  }

  submitWithArrow() {
    // Si email válido, enfocar contraseña; si ambos válidos, enviar
    if (this.email.valid && !this.password.valid) {
      const pwd = document.querySelector('input[formControlName="password"]') as HTMLInputElement | null;
      if (pwd) {
        pwd.focus();
        return;
      }
      this.password.markAsTouched();
      return;
    }

    if (this.loginForm.valid) {
      this.login();
    } else {
      this.email.markAsTouched();
      this.password.markAsTouched();
    }
  }

  async login() {
    if (this.loginForm.invalid) {
      const t = await this.toastCtrl.create({ message: 'Corrige los datos del formulario', duration: 2000, color: 'warning' });
      await t.present();
      return;
    }
    const loading = await this.loadingCtrl.create({ message: 'Iniciando sesión...' });
    await loading.present();

    // Validar credenciales con UserService (inyectado)
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;
    
    console.log('Intentando login con email:', email);
    
    try {
      const res = await this.userSvc.validateCredentials(email, password);
      await loading.dismiss();
      
      console.log('Resultado de validateCredentials:', res);
      
      if (res.ok === true && res.user) {
        console.log(`Login exitoso - Rol: ${res.user.rol}, navegando a /listar`);
        if (this.loginForm.value.remember) {
          try { 
            localStorage.setItem('app_current_user', JSON.stringify({ 
              id: res.user.id, 
              email: res.user.email,
              rol: res.user.rol
            })); 
          } catch (e) { }
        }
        
        // Mostrar mensaje de bienvenida con rol
        const rolMensaje = res.user.rol === 'admin' ? ' (Administrador)' : '';
        const welcomeToast = await this.toastCtrl.create({
          message: `Bienvenido${rolMensaje}`,
          duration: 1500,
          color: 'success'
        });
        await welcomeToast.present();
        
        this.navCtrl.navigateRoot('/listar');
      } else {
        console.log('Login fallido');
        const t = await this.toastCtrl.create({ message: 'Credenciales incorrectas', duration: 1800, color: 'danger' });
        await t.present();
      }
    } catch (err) {
      console.error('Error en login:', err);
      await loading.dismiss();
      const t = await this.toastCtrl.create({ message: 'Error en autenticación', duration: 1800, color: 'danger' });
      await t.present();
    }
  }

  async forgotPassword() {
    const t = await this.toastCtrl.create({ message: 'Función de recuperar contraseña (implementar)', duration: 1800 });
    await t.present();
  }

  socialLogin(provider: 'google' | 'facebook') {
    // Implementa OAuth o flujo de autenticación social
    this.toastCtrl.create({ message: `Login con ${provider} (implementar)`, duration: 1500 }).then(t => t.present());
  }

  goToRegister() {
    this.navCtrl.navigateForward('/register');
  }
}
