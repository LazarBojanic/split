import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ResearchEvent } from '../models/research-event.model';
import { FeedbackEntry } from '../models/feedback.model';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly isConfigured: boolean;
  private readonly client: SupabaseClient | null;

  constructor() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      this.isConfigured = false;
      this.client = null;
      return;
    }

    try {
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
      this.isConfigured = true;
    } catch {
      this.isConfigured = false;
      this.client = null;
    }
  }

  async insertEvents(events: ResearchEvent[]): Promise<void> {
    if (!this.client || !events.length) return;
    const rows = events.map((event) => ({
      id: event.id,
      name: event.name,
      path: event.path,
      session_id: event.sessionId,
      properties: event.properties,
      utm: event.utm,
      created_at: event.timestamp,
    }));
    const { error } = await this.client.from('events').insert(rows);
    if (error) throw error;
  }

  async insertFeedback(entry: FeedbackEntry): Promise<void> {
    if (!this.client) throw new Error('Supabase is not configured');
    const { error } = await this.client.from('feedback').insert({
      id: entry.id,
      name: entry.name || null,
      discord: entry.discord || null,
      level: entry.level,
      current_timer: entry.currentTimer || null,
      perceived_speed: entry.perceivedSpeed,
      opponent_felt_real: entry.opponentFeltReal,
      favorite_features: entry.favoriteFeatures,
      plan_choice: entry.planChoice,
      fair_price: entry.fairPrice || null,
      open_feedback: entry.openFeedback || null,
      consent: entry.consent,
      created_at: entry.createdAt,
    });
    if (error) throw error;
  }

  async dashboardSummary(): Promise<unknown> {
    if (!this.client) throw new Error('Supabase is not configured');
    const { data, error } = await this.client.rpc('dashboard_summary');
    if (error) throw error;
    return data;
  }
}
