import { Injectable, computed, inject, signal } from '@angular/core';
import { ResearchEvent } from '../models/research-event.model';
import { SupabaseService } from './supabase.service';

const EVENTS_KEY = 'split_research_events_v1';
const SESSION_KEY = 'split_research_session_v1';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly supabase = inject(SupabaseService);
  private readonly _events = signal<ResearchEvent[]>(this.readArray(EVENTS_KEY));
  private readonly sessionId = this.getOrCreateSessionId();
  private readonly utm = this.readUtm();
  private queue: ResearchEvent[] = [];
  private flushTimer: number | null = null;

  readonly events = this._events.asReadonly();
  readonly uniqueSessions = computed(
    () => new Set(this._events().map((event) => event.sessionId)).size,
  );
  readonly eventCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const event of this._events()) {
      counts.set(event.name, (counts.get(event.name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => this.flushNow());
    }
  }

  track(name: string, properties: Record<string, unknown> = {}): void {
    const event: ResearchEvent = {
      id: this.id(),
      name,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      properties,
      utm: this.utm,
    };
    this._events.update((events) => [...events, event]);
    this.writeArray(EVENTS_KEY, this._events());
    this.pushToDataLayer(event);

    if (this.supabase.isConfigured) {
      this.queue.push(event);
      if (this.queue.length >= 8) {
        this.flushNow();
      } else {
        this.scheduleFlush();
      }
    }
  }

  count(name: string): number {
    return this._events().filter((event) => event.name === name).length;
  }

  downloadEventsCsv(): void {
    const header = ['timestamp', 'event', 'path', 'sessionId', 'properties', 'utm'];
    const rows = this._events().map((event) => [
      event.timestamp,
      event.name,
      event.path,
      event.sessionId,
      JSON.stringify(event.properties),
      JSON.stringify(event.utm),
    ]);
    this.download('split-events.csv', this.toCsv([header, ...rows]));
  }

  downloadJson(): void {
    this.download(
      'split-research-data.json',
      JSON.stringify(
        { exportedAt: new Date().toISOString(), events: this._events() },
        null,
        2,
      ),
    );
  }

  clear(): void {
    this._events.set([]);
    this.writeArray(EVENTS_KEY, []);
    this.queue = [];
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimer !== null) return;
    this.flushTimer = window.setTimeout(() => {
      this.flushTimer = null;
      this.flushNow();
    }, 1500);
  }

  private flushNow(): void {
    if (!this.supabase.isConfigured || !this.queue.length) return;
    const batch = this.queue.splice(0, this.queue.length);
    void this.supabase.insertEvents(batch).catch(() => {
      this.queue = [...batch, ...this.queue].slice(0, 200);
      this.scheduleFlush();
    });
  }

  private getOrCreateSessionId(): string {
    try {
      const existing = localStorage.getItem(SESSION_KEY);
      if (existing) return existing;
      const created = this.id();
      localStorage.setItem(SESSION_KEY, created);
      return created;
    } catch {
      return this.id();
    }
  }

  private readUtm(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      const value = params.get(key);
      if (value) utm[key] = value;
    }
    return utm;
  }

  private id(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private readArray<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }

  private writeArray(key: string, value: unknown[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Keep the in-memory signal if storage is unavailable.
    }
  }

  private pushToDataLayer(event: ResearchEvent): void {
    if (typeof window === 'undefined') return;
    const dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
    if (Array.isArray(dataLayer)) {
      dataLayer.push({ event: event.name, ...event.properties });
    }
    const posthog = (
      window as unknown as {
        posthog?: { capture: (name: string, properties?: Record<string, unknown>) => void };
      }
    ).posthog;
    posthog?.capture(event.name, event.properties);
  }

  private toCsv(rows: string[][]): string {
    return rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\r\n');
  }

  private download(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}
