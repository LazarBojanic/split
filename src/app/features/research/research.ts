import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AnalyticsService } from '../../services/analytics.service';
import { DashboardService, DashboardSummary } from '../../services/dashboard.service';
import { FeedbackService } from '../../services/feedback.service';
import { FeedbackEntry } from '../../models/feedback.model';

@Component({
  selector: 'app-research',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <a routerLink="/" class="text-sm font-medium text-indigo-700 no-underline">← Back to Split</a>
          <h1 class="mt-2 text-2xl font-bold text-slate-900">Research dashboard</h1>
          <p class="text-sm text-slate-500">
            Anonymous usage events and feedback aggregates. Raw feedback text stays in Supabase.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <mat-chip-set>
            <mat-chip [highlighted]="source() === 'supabase'">
              {{ source() === 'supabase' ? 'Supabase live data' : 'Local fallback' }}
            </mat-chip>
          </mat-chip-set>
          <button mat-flat-button color="primary" type="button" (click)="load()" [disabled]="loading()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
          <button mat-stroked-button type="button" (click)="analytics.downloadEventsCsv()">
            <mat-icon>download</mat-icon>
            Event CSV
          </button>
          <button mat-stroked-button color="warn" type="button" (click)="clear()">
            <mat-icon>delete</mat-icon>
            Clear local
          </button>
        </div>
      </div>

      @if (error()) {
        <mat-card>
          <mat-card-content class="flex flex-col gap-2 text-sm text-amber-900">
            <p class="font-semibold">Dashboard notice</p>
            <p>{{ error() }}</p>
            <p class="text-xs text-amber-800">
              Add SUPABASE_URL and SUPABASE_ANON_KEY to .env, then run the build/start command again.
            </p>
          </mat-card-content>
        </mat-card>
      }

      @if (loading()) {
        <p class="text-sm text-slate-500">Loading dashboard...</p>
      } @else if (summary(); as s) {
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (card of cards(s); track card.label) {
            <mat-card>
              <mat-card-content>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ card.label }}</p>
                <p class="mt-2 text-3xl font-bold text-slate-900">{{ card.value }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ card.hint }}</p>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <mat-card>
            <mat-card-content class="!p-0">
              <div class="border-b border-slate-200 p-4">
                <h2 class="text-base font-semibold text-slate-900">Event counts</h2>
                <p class="text-xs text-slate-500">
                  {{ s.eventCount }} events across {{ s.sessionCount }} anonymous sessions.
                </p>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th class="px-4 py-2">Event</th>
                      <th class="px-4 py-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (row of s.eventCounts; track row.name) {
                      <tr>
                        <td class="px-4 py-2 font-mono text-xs">{{ row.name }}</td>
                        <td class="px-4 py-2 text-right font-semibold">{{ row.count }}</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="2" class="px-4 py-6 text-center text-slate-500">
                          No events yet.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-content class="!p-0">
              <div class="border-b border-slate-200 p-4">
                <h2 class="text-base font-semibold text-slate-900">Plan mix</h2>
                <p class="text-xs text-slate-500">
                  Pricing question answers from website feedback.
                </p>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th class="px-4 py-2">Plan answer</th>
                      <th class="px-4 py-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (row of s.planMix; track row.value) {
                      <tr>
                        <td class="px-4 py-2">{{ row.value || '—' }}</td>
                        <td class="px-4 py-2 text-right font-semibold">{{ row.count }}</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="2" class="px-4 py-6 text-center text-slate-500">
                          No feedback yet.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-content class="!p-0">
              <div class="border-b border-slate-200 p-4">
                <h2 class="text-base font-semibold text-slate-900">Cubing level</h2>
                <p class="text-xs text-slate-500">Self-reported 3x3 level.</p>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th class="px-4 py-2">Level</th>
                      <th class="px-4 py-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (row of s.levelMix; track row.value) {
                      <tr>
                        <td class="px-4 py-2">{{ row.value || '—' }}</td>
                        <td class="px-4 py-2 text-right font-semibold">{{ row.count }}</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="2" class="px-4 py-6 text-center text-slate-500">
                          No feedback yet.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-content class="!p-0">
              <div class="border-b border-slate-200 p-4">
                <h2 class="text-base font-semibold text-slate-900">Practice frequency</h2>
                <p class="text-xs text-slate-500">How often respondents practice.</p>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th class="px-4 py-2">Frequency</th>
                      <th class="px-4 py-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (row of s.practiceMix; track row.value) {
                      <tr>
                        <td class="px-4 py-2">{{ row.value || '—' }}</td>
                        <td class="px-4 py-2 text-right font-semibold">{{ row.count }}</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="2" class="px-4 py-6 text-center text-slate-500">
                          No feedback yet.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-content class="!p-0">
              <div class="border-b border-slate-200 p-4">
                <h2 class="text-base font-semibold text-slate-900">Main timer intent</h2>
                <p class="text-xs text-slate-500">Would they use Split as their main timer?</p>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th class="px-4 py-2">Answer</th>
                      <th class="px-4 py-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (row of s.mainTimerSplit; track row.value) {
                      <tr>
                        <td class="px-4 py-2">{{ row.value || '—' }}</td>
                        <td class="px-4 py-2 text-right font-semibold">{{ row.count }}</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="2" class="px-4 py-6 text-center text-slate-500">
                          No feedback yet.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-content class="!p-0">
              <div class="border-b border-slate-200 p-4">
                <h2 class="text-base font-semibold text-slate-900">Opponent realism</h2>
                <p class="text-xs text-slate-500">
                  Self-reported realism of the opponent.
                </p>
              </div>
              <div class="p-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Opponent felt real</p>
                  <table class="mt-2 w-full text-left text-sm">
                    <tbody class="divide-y divide-slate-100">
                      @for (row of s.opponentRealSplit; track row.value) {
                        <tr>
                          <td class="py-2">{{ row.value || '—' }}</td>
                          <td class="py-2 text-right font-semibold">{{ row.count }}</td>
                        </tr>
                      } @empty {
                        <tr><td class="py-2 text-slate-500">No data.</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card>
          <mat-card-content class="!p-0">
            <div class="border-b border-slate-200 p-4">
              <h2 class="text-base font-semibold text-slate-900">Top features</h2>
              <p class="text-xs text-slate-500">Most-mentioned features from feedback (up to 3 per person).</p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-4 py-2">Feature</th>
                    <th class="px-4 py-2 text-right">Mentions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (row of s.topFeatures; track row.feature) {
                    <tr>
                      <td class="px-4 py-2">{{ row.feature }}</td>
                      <td class="px-4 py-2 text-right font-semibold">{{ row.count }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="2" class="px-4 py-6 text-center text-slate-500">
                        No feature data yet.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
})
export class ResearchComponent implements OnInit {
  readonly analytics = inject(AnalyticsService);
  private readonly dashboard = inject(DashboardService);
  private readonly feedback = inject(FeedbackService);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly source = signal<'supabase' | 'local'>('local');

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    if (this.dashboard.isConfigured) {
      try {
        this.summary.set(await this.dashboard.load());
        this.source.set('supabase');
      } catch {
        this.summary.set(this.localSummary());
        this.source.set('local');
        this.error.set('Could not load Supabase data. Showing local events from this browser.');
      }
    } else {
      this.summary.set(this.localSummary());
      this.source.set('local');
      this.error.set('Supabase is not configured. Showing local events from this browser.');
    }

    this.loading.set(false);
  }

  cards(summary: DashboardSummary): { label: string; value: string; hint: string }[] {
    return [
      { label: 'Events', value: String(summary.eventCount), hint: 'All anonymous events.' },
      { label: 'Sessions', value: String(summary.sessionCount), hint: 'Unique anonymous sessions.' },
      { label: 'Feedback', value: String(summary.feedbackCount), hint: 'Website feedback submissions.' },
      {
        label: 'Avg responsiveness',
        value: summary.averageSpeed === null ? '—' : `${summary.averageSpeed}/5`,
        hint: 'How responsive the app felt.',
      },
    ];
  }

  clear(): void {
    if (confirm('Clear local analytics and feedback on this device? Supabase data is not deleted.')) {
      this.analytics.clear();
      this.feedback.clear();
      void this.load();
    }
  }

  private localSummary(): DashboardSummary {
    const events = this.analytics.events();
    const entries = this.feedback.entries();
    return {
      eventCount: events.length,
      sessionCount: new Set(events.map((event) => event.sessionId)).size,
      feedbackCount: entries.length,
      eventCounts: this.analytics.eventCounts(),
      planMix: this.countBy(entries, (entry) => entry.planChoice),
      levelMix: this.countBy(entries, (entry) => entry.level),
      practiceMix: this.countBy(entries, (entry) => entry.practiceFrequency),
      mainTimerSplit: this.countBy(entries, (entry) => entry.mainTimerIntent),
      opponentRealSplit: this.countBy(entries, (entry) => entry.opponentFeltReal),
      averageSpeed: entries.length
        ? Math.round(
            (entries.reduce((sum, entry) => sum + entry.perceivedSpeed, 0) / entries.length) * 100,
          ) / 100
        : null,
      topFeatures: this.topFeatures(entries),
    };
  }

  private countBy(
    entries: FeedbackEntry[],
    key: (entry: FeedbackEntry) => string,
  ): { value: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      const value = key(entry) || '—';
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }

  private topFeatures(entries: FeedbackEntry[]): { feature: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      for (const feature of entry.favoriteFeatures) {
        counts.set(feature, (counts.get(feature) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}
