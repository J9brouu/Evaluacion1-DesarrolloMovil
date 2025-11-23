import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, eye, eyeOff, closeOutline} from 'ionicons/icons';
import { GameService } from '../../services/game.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FotocamaraStorageService, FotoCamara } from 'src/app/services/fotocamara-storage.services';

@Component({
  selector: 'app-agregar',
  templateUrl: './agregar.page.html',
  styleUrls: ['./agregar.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton, CommonModule, ReactiveFormsModule]
})
export class AgregarPage implements OnInit {
  form: FormGroup;
 
  constructor(
    private navCtrl: NavController, 
    private toastCtrl: ToastController, 
    private fb: FormBuilder,
    private gameSvc: GameService,
    private fotoCamaraStorageService: FotocamaraStorageService
  ) {
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

  async ngOnInit() {
   this.fotos = await this.fotoCamaraStorageService.obtenerFoto('jortiz');
  }

    imagenCapturada: string | undefined;
    fotos: FotoCamara[] = [];

      async tomarFoto() {
         try {
           const foto = await Camera.getPhoto({
             quality: 90,
             allowEditing: false,
             resultType: CameraResultType.DataUrl,
             source: CameraSource.Camera
           });
           // Guardar la ruta de la imagen retornada por Capacitor
           this.imagenCapturada = foto.dataUrl;
           console.log('Foto tomada con éxito:', foto);
           console.log('Objeto foto completo:', this.imagenCapturada);

          // También guardar la DataURL en el control del formulario para que
          // al guardar el juego se incluya la imagen en la lista (localStorage)
          try { this.form.patchValue({ cover: this.imagenCapturada }); } catch (e) { /* noop */ }
     
           // Guardar la foto en el almacenamiento
           const nuevaFoto: FotoCamara = {
             nombreArchivo: `foto_${new Date().getTime()}.jpeg`,
             rutaArchivo: foto.webPath || '',
             fechaCaptura: new Date(),
           };
           this.fotos.push(nuevaFoto);
           await this.fotoCamaraStorageService.guardarFoto('jortiz', nuevaFoto);
           console.log('Foto guardada en el almacenamiento local.');
         } catch (error) {
           console.error('Error al tomar la foto:', error);
         }
       }

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
      // si el usuario tomó una foto y el campo cover está vacío, usarla
      cover: (payload.cover && payload.cover.length) ? payload.cover : this.imagenCapturada
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
