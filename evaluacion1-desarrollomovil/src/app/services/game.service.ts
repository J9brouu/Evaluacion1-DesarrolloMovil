import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Game {
  id: number;
  title: string;
  platform: string;
  genre?: string;
  year?: number;
  price?: number;
  cover?: string;
}

const STORAGE_KEY = 'app_games_v1';

@Injectable({ providedIn: 'root' })
export class GameService {
  private games$ = new BehaviorSubject<Game[]>(this.loadInitial());

  all(): Observable<Game[]> {
    return this.games$.asObservable();
  }

  getValue(): Game[] {
    return this.games$.getValue();
  }

  add(g: Omit<Game, 'id'>) {
    const list = this.getValue().slice();
    const id = Date.now();
    const newGame: Game = { id, ...g } as Game;
    list.unshift(newGame);
    this.save(list);
    this.games$.next(list);
    return newGame;
  }

  update(updated: Game) {
    const list = this.getValue().slice();
    const idx = list.findIndex(x => x.id === updated.id);
    if (idx > -1) {
      list[idx] = { ...updated };
      this.save(list);
      this.games$.next(list);
      return true;
    }
    return false;
  }

  delete(id: number) {
    const list = this.getValue().slice().filter(x => x.id !== id);
    this.save(list);
    this.games$.next(list);
  }

  private loadInitial(): Game[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Game[];
    } catch (e) {
      // ignore
    }
    // fallback sample data
    const sample: Game[] = [
      { id: 1, title: 'The Legend of Zelda: Breath of the Wild', platform: 'Switch', genre: 'Aventura', year: 2017, price: 59990, cover: 'assets/img/library-cover.png' },
      { id: 2, title: 'God of War', platform: 'PS4', genre: 'Acción', year: 2018, price: 49990, cover: 'assets/img/library-cover.png' },
      { id: 3, title: 'Hollow Knight', platform: 'PC', genre: 'Metroidvania', year: 2017, price: 15990, cover: 'assets/img/library-cover.png' },
      { id: 4, title: 'The Witcher 3: Wild Hunt', platform: 'PC', genre: 'RPG', year: 2015, price: 27990, cover: 'assets/img/library-cover.png' }
    ];
    this.save(sample);
    return sample;
  }

  private save(list: Game[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { /* noop */ }
  }
}
