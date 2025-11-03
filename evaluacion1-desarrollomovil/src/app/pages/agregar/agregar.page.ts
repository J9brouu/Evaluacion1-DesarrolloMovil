import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, eye, eyeOff, closeOutline} from 'ionicons/icons';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-agregar',
  templateUrl: './agregar.page.html',
  styleUrls: ['./agregar.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, CommonModule, ReactiveFormsModule]
})
export class AgregarPage implements OnInit {
  form: FormGroup;

  constructor(private navCtrl: NavController, private toastCtrl: ToastController, private fb: FormBuilder, private gameSvc: GameService) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      platform: ['', [Validators.required]],
      genre: [''],
      year: [null, [Validators.min(1950), Validators.max(new Date().getFullYear())]],
      price: [null, [Validators.required, Validators.min(0), Validators.pattern('^[0-9]+$')]], // CLP entero
      cover: ['']
    });
    addIcons({ 
      'add-outline': addOutline,
      'eye': eye,
      'eye-off': eyeOff,
      'close-outline': closeOutline
     });
  }

  ngOnInit() {}

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const t = await this.toastCtrl.create({ message: 'Por favor completa los campos requeridos', duration: 1400 });
      await t.present();
      return;
    }

    const payload = this.form.value;
    // persistir mediante GameService
    const created = this.gameSvc.add({
      title: payload.title,
      platform: payload.platform,
      genre: payload.genre,
      year: payload.year,
      price: Number(payload.price),
      cover: payload.cover
    });

    const priceLabel = (created.price || created.price === 0)
      ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(created.price))
      : '';
    const toast = await this.toastCtrl.create({ message: `Juego creado: ${created.title} ${priceLabel}`, duration: 1400 });
    await toast.present();
    // Navegar a la lista para evitar volver a pantallas previas (p. ej. registro)
    await this.navCtrl.navigateBack('/listar');
  }

  cancel() {
    // regresar a la lista en lugar de usar el historial
    this.navCtrl.navigateBack('/listar');
  }
}
