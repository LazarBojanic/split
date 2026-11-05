import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LeaderboardService } from '../../services/leaderboard.service';
import { CubeEvent } from '../../models/solve.model';
import { formatMs } from '../../utils/time';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Leaderboard</h1>
          <p class="text-sm text-slate-500">
            Skill-based rankings. Anonymous entries are allowed, and a paid plan never changes your rank.
          </p>
        </div>
        <mat-chip-set>
          <mat-chip highlighted>3x3 · prototype data</mat-chip>
        </mat-chip-set>
      </div>

      <mat-card class="">
        <mat-card-content class="!p-4">
          <div class="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Search cuber</mat-label>
              <input matInput [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="e.g. Luka" />
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Scope</mat-label>
              <mat-select [ngModel]="scope()" (ngModelChange)="scope.set($event)">
                <mat-option value="global">Global</mat-option>
                <mat-option value="server">Cubing Lounge</mat-option>
                <mat-option value="friends">Friends</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Event</mat-label>
              <mat-select [ngModel]="event()" (ngModelChange)="event.set($event)">
                <mat-option value="3x3">3x3</mat-option>
                <mat-option value="2x2" disabled>2x2 (later)</mat-option>
                <mat-option value="4x4" disabled>4x4 (later)</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="">
        <mat-card-content class="!p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-4 py-3">#</th>
                  <th class="px-4 py-3">Cuber</th>
                  <th class="px-4 py-3">Best</th>
                  <th class="px-4 py-3">ao5</th>
                  <th class="px-4 py-3">ao12</th>
                  <th class="px-4 py-3">Server</th>
                  <th class="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (entry of rows(); track entry.id; let index = $index) {
                  <tr [class.bg-indigo-50]="entry.id.startsWith('local-')">
                    <td class="px-4 py-3 text-slate-500">{{ index + 1 }}</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <span
                          class="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white"
                          [style.background]="entry.accent"
                        >
                          {{ entry.name.charAt(0).toUpperCase() }}
                        </span>
                        <div>
                          <p class="font-semibold text-slate-900">
                            {{ entry.name }}
                            @if (entry.id.startsWith('local-')) {
                              <span class="ml-1 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">you</span>
                            }
                          </p>
                          <p class="text-xs text-slate-500">
                            {{ entry.country }} · {{ entry.anonymous ? 'anonymous' : 'named' }}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td class="timer-display px-4 py-3 font-semibold text-slate-900">{{ format(entry.bestMs) }}</td>
                    <td class="timer-display px-4 py-3 text-slate-700">{{ format(entry.ao5Ms) }}</td>
                    <td class="timer-display px-4 py-3 text-slate-700">
                      {{ entry.ao12Ms === null ? '—' : format(entry.ao12Ms) }}
                    </td>
                    <td class="px-4 py-3 text-slate-600">{{ entry.server }}</td>
                    <td class="px-4 py-3 text-xs text-slate-500">{{ entry.updatedAt | date: 'shortDate' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                      No entries match the filters.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </mat-card-content>
      </mat-card>

      <p class="text-xs text-slate-500">
        Prototype data. Your anonymous race results are stored on this device and added to the table.
      </p>
    </div>
  `,
})
export class LeaderboardComponent {
  private readonly leaderboard = inject(LeaderboardService);

  readonly query = signal('');
  readonly scope = signal<'global' | 'server' | 'friends'>('global');
  readonly event = signal<CubeEvent>('3x3');
  readonly rows = computed(() =>
    this.leaderboard.filtered({
      scope: this.scope(),
      event: this.event(),
      query: this.query(),
    }),
  );

  format(ms: number): string {
    return formatMs(ms);
  }
}
