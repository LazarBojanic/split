import { Injectable, signal } from '@angular/core';
import { LeaderboardEntry } from '../models/leaderboard.model';
import { CubeEvent } from '../models/solve.model';
import { MOCK_LEADERBOARD } from '../mock-data/mock-leaderboard';

const LOCAL_KEY = 'split_local_leaderboard_v1';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly _entries = signal<LeaderboardEntry[]>(this.read());
  readonly entries = this._entries.asReadonly();

  addResult(input: {
    name: string;
    timeMs: number;
    event?: CubeEvent;
    server?: string;
    anonymous?: boolean;
  }): void {
    const event = input.event ?? '3x3';
    const existing = this._entries().find(
      (entry) => entry.name === input.name && entry.event === event,
    );

    if (existing) {
      const nextBest = Math.min(existing.bestMs, input.timeMs);
      const nextAo5 = Math.round(existing.ao5Ms * 0.8 + input.timeMs * 0.2);
      const nextAo12 = Math.round(
        (existing.ao12Ms ?? existing.ao5Ms) * 0.9167 + input.timeMs * 0.0833,
      );
      this._entries.update((entries) =>
        entries.map((entry) =>
          entry.id === existing.id
            ? {
                ...entry,
                bestMs: nextBest,
                ao5Ms: nextAo5,
                ao12Ms: nextAo12,
                updatedAt: new Date().toISOString(),
              }
            : entry,
        ),
      );
    } else {
      const created: LeaderboardEntry = {
        id: `local-${Date.now()}`,
        name: input.name,
        event,
        bestMs: input.timeMs,
        ao5Ms: input.timeMs,
        ao12Ms: input.timeMs,
        country: '—',
        server: input.server ?? 'Your server',
        accent: '#4338ca',
        anonymous: input.anonymous ?? true,
        updatedAt: new Date().toISOString(),
      };
      this._entries.update((entries) => [...entries, created]);
    }

    this.write();
  }

  removeResult(name: string, event: CubeEvent = '3x3'): void {
    this._entries.update((entries) =>
      entries.filter(
        (entry) =>
          !(entry.name === name && entry.event === event && entry.id.startsWith('local-')),
      ),
    );
    this.write();
  }

  filtered(input: {
    scope: 'global' | 'server' | 'friends';
    event: CubeEvent;
    query: string;
  }): LeaderboardEntry[] {
    const query = input.query.trim().toLowerCase();
    return [...this._entries()]
      .filter((entry) => entry.event === input.event)
      .filter((entry) =>
        input.scope === 'global' ? true : entry.server === 'Cubing Lounge',
      )
      .filter((entry) => !query || entry.name.toLowerCase().includes(query))
      .sort((a, b) => a.bestMs - b.bestMs);
  }

  private read(): LeaderboardEntry[] {
    const stored = this.readLocal();
    return [...MOCK_LEADERBOARD, ...stored];
  }

  private readLocal(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
    } catch {
      return [];
    }
  }

  private write(): void {
    try {
      const local = this._entries().filter((entry) => entry.id.startsWith('local-'));
      localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
    } catch {
      // Keep the in-memory entries.
    }
  }
}
