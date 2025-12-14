import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, ToastController, LoadingController } from '@ionic/angular';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, eye, eyeOff, closeOutline} from 'ionicons/icons';
import { FirebaseGameService } from '../../services/firebase-game.service';
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
    private loadingCtrl: LoadingController,
    private fb: FormBuilder,
    private gameSvc: FirebaseGameService,
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

    const loading = await this.loadingCtrl.create({ message: 'Guardando juego...' });
    await loading.present();

    const payload = this.form.value;
    
    try {
      console.log('Guardando juego en Firebase:', payload);
      
      await this.gameSvc.agregarJuego({
        title: payload.title,
        platform: payload.platform,
        genre: payload.genre,
        year: payload.year,
        price: Number(payload.price),
        cover: (payload.cover && payload.cover.length) ? payload.cover : this.imagenCapturada
      });

      await loading.dismiss();
      
      const priceLabel = (payload.price || payload.price === 0)
        ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(payload.price))
        : '';
      const toast = await this.toastCtrl.create({ 
        message: `Juego creado: ${payload.title} ${priceLabel}`, 
        duration: 1400,
        color: 'success'
      });
      await toast.present();
      
      await this.navCtrl.navigateBack('/listar');
    } catch (error) {
      console.error('Error al guardar juego en Firebase:', error);
      await loading.dismiss();
      const t = await this.toastCtrl.create({ 
        message: 'Error al guardar en la base de datos', 
        duration: 1800,
        color: 'danger'
      });
      await t.present();
    }
  }

  cancel() {
    // regresar a la lista en lugar de usar el historial
    this.navCtrl.navigateBack('/listar');
  }
}
