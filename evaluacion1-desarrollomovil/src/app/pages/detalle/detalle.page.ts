import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { GameService, Game } from '../../services/game.service';
import { addIcons } from 'ionicons';
import { saveOutline, trashOutline, closeOutline } from 'ionicons/icons';
@Component({
  selector: 'app-detalle',
  templateUrl: './detalle.page.html',
  styleUrls: ['./detalle.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, CommonModule, ReactiveFormsModule]
})
export class DetallePage implements OnInit {
  form: FormGroup;
  game: Game | null = null;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private gameSvc: GameService
  ) {
    this.form = this.fb.group({
      id: [null],
      title: ['', [Validators.required, Validators.minLength(2)]],
      platform: ['', [Validators.required]],
      genre: [''],
      year: [null, [Validators.min(1950), Validators.max(new Date().getFullYear())]],
      price: [null, [Validators.required, Validators.min(0), Validators.pattern('^[0-9]+$')]],
      cover: ['']
    });
    addIcons({
      'save-outline': saveOutline,
      'trash-outline': trashOutline,
      'close-outline': closeOutline
     })
  }

  ngOnInit() {
    // Intent: receive the game via navigation state (history.state) or fallback to an example
    const state: any = history.state || {};
    if (state && state.game) {
      this.game = state.game as Game;
    }

    if (!this.game) {
      // fallback: empty or example (so page still renders)
      this.game = {
        id: 0,
        title: '',
        platform: '',
        genre: '',
        year: undefined,
        cover: ''
      } as Game;
    }

  this.form.patchValue(this.game!);
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const t = await this.toastCtrl.create({ message: 'Por favor completa los campos requeridos', duration: 1400 });
      await t.present();
      return;
    }

    const payload = this.form.value as any;
    const success = this.gameSvc.update({
      id: payload.id,
      title: payload.title,
      platform: payload.platform,
      genre: payload.genre,
      year: payload.year,
      price: Number(payload.price),
      cover: payload.cover
    });

    if (success) {
      const toast = await this.toastCtrl.create({ message: `Guardado: ${payload.title}`, duration: 1200 });
      await toast.present();
      this.navCtrl.back();
    } else {
      const t = await this.toastCtrl.create({ message: 'Error al guardar', duration: 1200 });
      await t.present();
    }
  }

  async remove() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Seguro que deseas eliminar este juego?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
            handler: async () => {
            // eliminar mediante servicio
            const id = this.form.value.id;
            if (id) this.gameSvc.delete(id);
            const t = await this.toastCtrl.create({ message: 'Juego eliminado', duration: 1200 });
            await t.present();
            this.navCtrl.back();
          }
        }
      ]
    });
    await alert.present();
  }

  cancel() {
    this.navCtrl.back();
  }

}
