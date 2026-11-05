import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface CountRow {
  value: string;
  count: number;
}

export interface EventCountRow {
  name: string;
  count: number;
}

export interface FeatureCountRow {
  feature: string;
  count: number;
}

export interface DashboardSummary {
  eventCount: number;
  sessionCount: number;
  feedbackCount: number;
  eventCounts: EventCountRow[];
  planMix: CountRow[];
  levelMix: CountRow[];
  practiceMix: CountRow[];
  mainTimerSplit: CountRow[];
  opponentRealSplit: CountRow[];
  averageSpeed: number | null;
  topFeatures: FeatureCountRow[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly supabase = inject(SupabaseService);

  get isConfigured(): boolean {
    return this.supabase.isConfigured;
  }

  async load(): Promise<DashboardSummary> {
    const raw = (await this.supabase.dashboardSummary()) as Record<string, unknown>;
    return {
      eventCount: Number(raw['event_count'] ?? 0),
      sessionCount: Number(raw['session_count'] ?? 0),
      feedbackCount: Number(raw['feedback_count'] ?? 0),
      eventCounts: (raw['event_counts'] as EventCountRow[]) ?? [],
      planMix: (raw['plan_mix'] as CountRow[]) ?? [],
      levelMix: (raw['level_mix'] as CountRow[]) ?? [],
      practiceMix: (raw['practice_mix'] as CountRow[]) ?? [],
      mainTimerSplit: (raw['main_timer_split'] as CountRow[]) ?? [],
      opponentRealSplit: (raw['opponent_real_split'] as CountRow[]) ?? [],
      averageSpeed:
        raw['average_speed'] === null || raw['average_speed'] === undefined
          ? null
          : Number(raw['average_speed']),
      topFeatures: (raw['top_features'] as FeatureCountRow[]) ?? [],
    };
  }
}
