import { Injectable, inject, signal } from '@angular/core';
import { FeedbackEntry } from '../models/feedback.model';
import { AnalyticsService } from './analytics.service';
import { SupabaseService } from './supabase.service';

const FEEDBACK_KEY = 'split_feedback_v1';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly analytics = inject(AnalyticsService);
  private readonly supabase = inject(SupabaseService);
  private readonly _entries = signal<FeedbackEntry[]>(this.read());
  readonly entries = this._entries.asReadonly();

  async submit(input: Omit<FeedbackEntry, 'id' | 'createdAt'>): Promise<{
    ok: boolean;
    remote: boolean;
    error?: string;
  }> {
    const entry: FeedbackEntry = {
      ...input,
      id: this.id(),
      createdAt: new Date().toISOString(),
    };

    this._entries.update((entries) => [...entries, entry]);
    this.write();
    this.analytics.track('feedback_submit', {
      level: entry.level,
      planChoice: entry.planChoice,
      opponentFeltReal: entry.opponentFeltReal,
    });

    if (!this.supabase.isConfigured) {
      return { ok: true, remote: false };
    }

    try {
      await this.supabase.insertFeedback(entry);
      return { ok: true, remote: true };
    } catch (error) {
      return {
        ok: false,
        remote: false,
        error: error instanceof Error ? error.message : 'Could not save feedback.',
      };
    }
  }

  clear(): void {
    this._entries.set([]);
    this.write();
  }

  private read(): FeedbackEntry[] {
    try {
      const raw = localStorage.getItem(FEEDBACK_KEY);
      return raw ? (JSON.parse(raw) as FeedbackEntry[]) : [];
    } catch {
      return [];
    }
  }

  private write(): void {
    try {
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(this._entries()));
    } catch {
      // Keep the in-memory entries.
    }
  }

  private id(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
