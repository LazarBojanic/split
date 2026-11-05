import { Injectable } from '@angular/core';

const FACES = ['U', 'D', 'L', 'R', 'F', 'B'];
const MODIFIERS = ['', "'", '2'];

@Injectable({ providedIn: 'root' })
export class ScrambleService {
  next(length = 20): string {
    const moves: string[] = [];
    let lastFace = '';

    while (moves.length < length) {
      const face = FACES[Math.floor(Math.random() * FACES.length)];
      if (face === lastFace) continue;
      const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
      moves.push(`${face}${modifier}`);
      lastFace = face;
    }

    return moves.join(' ');
  }
}
