import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonSearchbar
} from '@ionic/angular/standalone';
import { FilterGamesPipe } from '../../pipes/filter-games.pipe';
import { addIcons } from 'ionicons';
import { addOutline, caretForwardOutline } from 'ionicons/icons';
import { GameService, Game } from '../../services/game.service';

@Component({
  selector: 'app-listar',
  templateUrl: './listar.page.html',
  styleUrls: ['./listar.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonSearchbar, CommonModule, FormsModule, FilterGamesPipe]
})
export class ListarPage implements OnInit {
  games: Game[] = [];
  filter = '';

  constructor(private navCtrl: NavController, private toastCtrl: ToastController, private gameSvc: GameService) {
    // registrar con un nombre (clave) válido
    addIcons({ 
      'add-outline': addOutline,
      'caret-forward-outline': caretForwardOutline
    });
  }

  onImgError(event: Event, g: Game) {
    // Remove cover so template shows fallback icon
    try { g.cover = ''; } catch (e) { /* ignore */ }
  }

  openAdd() {
    this.navCtrl.navigateForward('/agregar');
  }

  ngOnInit() {
    this.gameSvc.all().subscribe(list => {
      this.games = list;
    });
  }

  trackById(_: number, item: Game) {
    return item.id;
  }

  viewDetail(g: Game) {
    // navigate and pass the game in navigation state so DetallePage can read it
    this.navCtrl.navigateForward('/detalle', { state: { game: g } });
  }
}
