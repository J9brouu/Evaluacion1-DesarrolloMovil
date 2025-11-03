import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, LoadingController, ToastController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonButton,
  IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline, eye, eyeOff, logoGoogle, logoFacebook, personCircleOutline, mailOutline, lockOpenOutline } from 'ionicons/icons';

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
    private toastCtrl: ToastController
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
    if (this.registerForm.invalid) {
      const t = await this.toastCtrl.create({ message: 'Completa los campos requeridos', duration: 1800, color: 'warning' });
      await t.present();
      this.name.markAsTouched();
      this.email.markAsTouched();
      this.password.markAsTouched();
      this.confirmPassword.markAsTouched();
      return;
    }

    if (this.password.value !== this.confirmPassword.value) {
      const t = await this.toastCtrl.create({ message: 'Las contraseñas no coinciden', duration: 2000, color: 'danger' });
      await t.present();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Creando cuenta...' });
    await loading.present();

    setTimeout(async () => {
      await loading.dismiss();
      // Tras registro, navegar al login
      this.navCtrl.navigateBack(['/login']);
      const t = await this.toastCtrl.create({ message: 'Cuenta creada (simulado)', duration: 1400, color: 'success' });
      await t.present();
    }, 900);
  }

  goToLogin() {
    this.navCtrl.navigateBack('/login');
  }
}
