import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterGames',
  standalone: true
})
export class FilterGamesPipe implements PipeTransform {
  transform(games: any[] | null | undefined, filter?: string): any[] {
    if (!games) return [];
    if (!filter) return games;
    const q = filter.toString().trim().toLowerCase();
    if (!q) return games;
    return games.filter(g => {
      const title = (g.title || '').toString().toLowerCase();
      const platform = (g.platform || '').toString().toLowerCase();
      const genre = (g.genre || '').toString().toLowerCase();
      return title.includes(q) || platform.includes(q) || genre.includes(q);
    });
  }
}
