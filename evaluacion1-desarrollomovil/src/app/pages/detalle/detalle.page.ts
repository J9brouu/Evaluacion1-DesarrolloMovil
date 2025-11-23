import { Component, OnInit, OnDestroy } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton } from '@ionic/angular/standalone';
import { GameService, Game } from '../../services/game.service';
import { addIcons } from 'ionicons';
import { saveOutline, trashOutline, closeOutline } from 'ionicons/icons';
@Component({
  selector: 'app-detalle',
  templateUrl: './detalle.page.html',
  styleUrls: ['./detalle.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, CommonModule, ReactiveFormsModule, IonButton],
})
export class DetallePage implements OnInit, OnDestroy {
  form: FormGroup;
  game: Game | null = null;
  private _coverObjectUrl: string | null = null;
  coverPreviewUrl: string | null = null; // url mostrada en la previsualización (puede ser https o blob)
  coverUrlForInput = ''; // valor mostrado en el input de URL (oculta blob urls)

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

  // Inicializar coverPreviewUrl y campo de texto según el valor existente
  const coverVal = this.form.value.cover as string | undefined;
  if (coverVal) {
    if (coverVal.startsWith('blob:')) {
      // imagen local previamente seleccionada en esta sesión
      this.coverPreviewUrl = coverVal;
      this._coverObjectUrl = coverVal;
      this.coverUrlForInput = '';
    } else {
      // url remota
      this.coverPreviewUrl = coverVal;
      this.coverUrlForInput = coverVal;
    }
  }
  }

  ngOnDestroy(): void {
    // liberar object URL si existe
    if (this._coverObjectUrl) {
      try { URL.revokeObjectURL(this._coverObjectUrl); } catch (e) { /* ignore */ }
      this._coverObjectUrl = null;
    }
  }

  /** Handler cuando el usuario selecciona un archivo de imagen */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files && input.files.length ? input.files[0] : null;
    if (!file) return;

    // revocar object URL previo si existía (limpieza)
    if (this._coverObjectUrl) {
      try { URL.revokeObjectURL(this._coverObjectUrl); } catch (e) { }
      this._coverObjectUrl = null;
    }

    // Leer el archivo y convertir a DataURL para persistirlo en localStorage y mostrarlo en <img>
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string | null;
      if (result) {
        // Guardar DataURL en el formulario (persistible)
        this.form.patchValue({ cover: result });
        this.coverPreviewUrl = result;
        this.coverUrlForInput = '';
      }
    };
    reader.onerror = () => {
      console.error('Error leyendo el archivo de imagen');
    };
    reader.readAsDataURL(file);
  }

  /** Abrir la cámara del dispositivo (Capacitor) y tomar una foto */
  async takePhoto() {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      // revocar object URL previo si existiera
      if (this._coverObjectUrl) {
        try { URL.revokeObjectURL(this._coverObjectUrl); } catch (e) { }
        this._coverObjectUrl = null;
      }

      const dataUrl = photo && (photo as any).dataUrl ? (photo as any).dataUrl as string : null;
      if (dataUrl) {
        // guardar DataURL directamente en el form (persistible en memoria)
        this.form.patchValue({ cover: dataUrl });
        this.coverPreviewUrl = dataUrl;
        this.coverUrlForInput = '';
      }
    } catch (err) {
      // el usuario puede cancelar la cámara; no hacemos nada
      // console.debug('Camera cancelled or error', err);
    }
  }

  /** Alias en español para compatibilidad con `agregar` */
  async tomarFoto() {
    await this.takePhoto();
  }

  removeCover() {
    const current = this.form.value.cover as string | undefined;
    if (current && this._coverObjectUrl === current) {
      try { URL.revokeObjectURL(current); } catch (e) { }
      this._coverObjectUrl = null;
    }
    this.form.patchValue({ cover: '' });
    this.coverPreviewUrl = null;
    this.coverUrlForInput = '';
  }

  onCoverUrlInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const val = input.value?.trim() || '';
    this.coverUrlForInput = val;
    // si el usuario escribe una url, usarla como preview y guardarla en el form
    if (val) {
      // si había un object URL previo, revocarlo
      if (this._coverObjectUrl) {
        try { URL.revokeObjectURL(this._coverObjectUrl); } catch (e) { }
        this._coverObjectUrl = null;
      }
      this.coverPreviewUrl = val;
      this.form.patchValue({ cover: val });
    } else {
      // limpiar preview si el campo está vacío
      this.coverPreviewUrl = null;
      this.form.patchValue({ cover: '' });
    }
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
