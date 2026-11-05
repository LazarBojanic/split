import { Injectable, signal } from '@angular/core';

const NAME_KEY = 'split_display_name_v1';
const ADJECTIVES = ['fast', 'quiet', 'steady', 'lucky', 'sharp', 'calm'];
const NOUNS = ['cuber', 'solver', 'turner', 'ghost', 'timer', 'anon'];

@Injectable({ providedIn: 'root' })
export class IdentityService {
  private readonly _name = signal(this.readName());
  readonly name = this._name.asReadonly();

  setName(value: string): void {
    const next = value.trim().slice(0, 24);
    if (!next) return;
    this._name.set(next);
    try {
      localStorage.setItem(NAME_KEY, next);
    } catch {
      // Keep the in-memory name if storage is unavailable.
    }
  }

  regenerate(): void {
    this.setName(this.randomName());
  }

  private readName(): string {
    try {
      const stored = localStorage.getItem(NAME_KEY);
      if (stored) return stored;
      const generated = this.randomName();
      localStorage.setItem(NAME_KEY, generated);
      return generated;
    } catch {
      return this.randomName();
    }
  }

  private randomName(): string {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const suffix = Math.floor(10 + Math.random() * 90);
    return `${adjective}_${noun}_${suffix}`;
  }
}
