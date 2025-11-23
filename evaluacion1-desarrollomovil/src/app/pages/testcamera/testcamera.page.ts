import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonButton } from '@ionic/angular/standalone';
import { FotocamaraStorageService, FotoCamara } from 'src/app/services/fotocamara-storage.services';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-testcamera',
  templateUrl: './testcamera.page.html',
  styleUrls: ['./testcamera.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonCard, IonCardContent, IonButton]
})
export class TestcameraPage implements OnInit {
  imagenCapturada: string | undefined;
  fotos: FotoCamara[] = [];

  constructor(
    private fotoCamaraStorageService: FotocamaraStorageService
  ) { }

  async ngOnInit() {
    this.fotos = await this.fotoCamaraStorageService.obtenerFoto('jortiz');
  }
  
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
}

