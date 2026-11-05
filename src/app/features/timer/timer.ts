import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TimerService } from '../../services/timer.service';
import { AnalyticsService } from '../../services/analytics.service';
import { formatMs } from '../../utils/time';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Solo timer</h1>
          <p class="text-sm text-slate-500">
            Space or tap once to inspect, again to start, again to stop. Esc resets.
          </p>
        </div>
        <mat-chip-set>
          <mat-chip highlighted>3x3 · no account</mat-chip>
        </mat-chip-set>
      </div>

      <mat-card class="">
        <mat-card-content class="!p-5">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div class="flex flex-wrap items-center gap-4">
              <mat-slide-toggle
                [checked]="timer.inspectionEnabled()"
                [disabled]="timer.state() === 'running' || timer.state() === 'inspection'"
                (change)="timer.setInspectionEnabled($event.checked)"
              >
                15s inspection
              </mat-slide-toggle>
              <span class="text-xs text-slate-500">
                @if (timer.inspectionEnabled()) {
                  First input starts inspection; second input starts the timer.
                } @else {
                  First input starts the timer; second input stops it.
                }
              </span>
            </div>
            <div class="flex gap-2">
              <button mat-stroked-button type="button" (click)="copyScramble()">
                <mat-icon>content_copy</mat-icon>
                Copy
              </button>
              <button mat-stroked-button type="button" (click)="timer.newScramble()">
                <mat-icon>refresh</mat-icon>
                New
              </button>
            </div>
          </div>

          <div class="mt-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Scramble</p>
            <p class="mt-1 max-w-3xl font-mono text-sm leading-relaxed text-slate-700">
              {{ timer.scramble() }}
            </p>
            @if (copied()) {
              <p class="mt-2 text-xs font-medium text-green-700">Scramble copied.</p>
            }
          </div>

          <div
            class="mt-5 flex min-h-[260px] select-none flex-col items-center justify-center bg-slate-900 p-6 text-white"
            (pointerdown)="onPointerDown($event)"
          >
            @if (timer.state() === 'inspection') {
              <p class="text-sm font-semibold uppercase tracking-wide text-amber-300">
                Inspection
              </p>
              @if (timer.inspectionLeftMs() >= 0) {
                <p class="timer-display mt-2 text-7xl font-bold text-amber-300">
                  {{ (timer.inspectionLeftMs() / 1000).toFixed(1) }}
                </p>
                <p class="mt-2 text-xs text-slate-400">
                  Press Space or tap to start the solve.
                </p>
              } @else if (timer.inspectionPenalty() === '+2') {
                <p class="timer-display mt-2 text-7xl font-bold text-orange-400">
                  +{{ ((-timer.inspectionLeftMs()) / 1000).toFixed(1) }}
                </p>
                <p class="mt-2 text-xs font-semibold text-orange-300">
                  Inspection over by more than 15s — this solve will get +2.
                </p>
              } @else {
                <p class="timer-display mt-2 text-7xl font-bold text-red-400">DNF</p>
                <p class="mt-2 text-xs font-semibold text-red-300">
                  Inspection over by more than 17s — this solve is DNF.
                </p>
              }
            } @else {
              <p
                class="timer-display text-7xl font-bold sm:text-8xl"
                [class.text-indigo-300]="timer.state() === 'stopped'"
              >
                {{ format(timer.elapsedMs()) }}
              </p>
              <p class="mt-3 text-xs text-slate-400">
                @switch (timer.state()) {
                  @case ('idle') { Press Space or tap to start. }
                  @case ('running') { Press Space or tap to stop. }
                  @case ('stopped') { Press Space or tap to start the next solve. }
                }
              </p>
            }
          </div>

          <div class="mt-4 flex flex-wrap gap-3">
            <button mat-flat-button color="primary" type="button" (click)="timer.handleInput()">
              <mat-icon>{{ primaryIcon() }}</mat-icon>
              {{ primaryLabel() }}
            </button>
            <button mat-stroked-button type="button" (click)="timer.reset()">
              <mat-icon>restart_alt</mat-icon>
              Reset
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (stat of statCards(); track stat.label) {
          <mat-card class="">
            <mat-card-content class="!p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ stat.label }}</p>
              <p class="timer-display mt-2 text-2xl font-bold text-slate-900">{{ stat.value }}</p>
            </mat-card-content>
          </mat-card>
        }
      </div>
      @if (timer.stats().dnfCount > 0) {
        <p class="text-xs text-slate-500">
          DNF solves are excluded from best/mean/ao5/ao12. {{ timer.stats().dnfCount }} DNF in this session.
        </p>
      }

      <mat-card class="">
        <mat-card-content class="!p-0">
          <div class="flex items-center justify-between border-b border-slate-200 p-4">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Recent solves</h2>
              <p class="text-xs text-slate-500">{{ timer.solves().length }} saved on this device.</p>
            </div>
            @if (timer.solves().length) {
              <button mat-stroked-button color="warn" type="button" (click)="timer.clearSolves()">
                <mat-icon>delete_sweep</mat-icon>
                Clear
              </button>
            }
          </div>
          @if (timer.solves().length) {
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-4 py-2">#</th>
                    <th class="px-4 py-2">Time</th>
                    <th class="px-4 py-2">Penalty</th>
                    <th class="px-4 py-2">Source</th>
                    <th class="px-4 py-2">Scramble</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (solve of timer.solves().slice(0, 10); track solve.id; let index = $index) {
                    <tr>
                      <td class="px-4 py-2 text-slate-500">{{ index + 1 }}</td>
                      <td class="px-4 py-2">
                        @if (solve.penalty === 'DNF') {
                          <span class="font-semibold text-red-700">DNF</span>
                          <span class="ml-1 text-xs text-slate-400">({{ format(solve.rawTimeMs) }})</span>
                        } @else {
                          <span class="timer-display font-semibold text-slate-900">{{ format(solve.timeMs) }}</span>
                          @if (solve.penalty === '+2') {
                            <span class="ml-1 text-xs text-orange-600">+2 from {{ format(solve.rawTimeMs) }}</span>
                          }
                        }
                      </td>
                      <td class="px-4 py-2">
                        <div class="flex flex-wrap gap-1">
                          <button
                            mat-button
                            type="button"
                            class="!min-w-0 !px-2"
                            [color]="solve.penalty === 'none' ? 'primary' : undefined"
                            (click)="timer.setPenalty(solve.id, 'none')"
                          >
                            OK
                          </button>
                          <button
                            mat-button
                            type="button"
                            class="!min-w-0 !px-2"
                            [color]="solve.penalty === '+2' ? 'primary' : undefined"
                            (click)="timer.setPenalty(solve.id, '+2')"
                          >
                            +2
                          </button>
                          <button
                            mat-button
                            type="button"
                            class="!min-w-0 !px-2"
                            [color]="solve.penalty === 'DNF' ? 'warn' : undefined"
                            (click)="timer.setPenalty(solve.id, 'DNF')"
                          >
                            DNF
                          </button>
                        </div>
                      </td>
                      <td class="px-4 py-2">
                        <span class="bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {{ solve.source }}
                        </span>
                      </td>
                      <td class="max-w-md truncate px-4 py-2 font-mono text-xs text-slate-500">
                        {{ solve.scramble }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="p-6 text-sm text-slate-500">
              No solves yet. Press Space or tap the panel to start.
            </p>
          }
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">How was the timer?</h2>
            <p class="mt-1 text-sm text-slate-600">
              Two-minute feedback. No login. Completely anonymous.
            </p>
          </div>
          <a mat-stroked-button routerLink="/feedback">
            <mat-icon>rate_review</mat-icon>
            Give feedback
          </a>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class TimerComponent implements OnInit, OnDestroy {
  readonly timer = inject(TimerService);
  private readonly analytics = inject(AnalyticsService);
  readonly copied = signal(false);

  ngOnInit(): void {
    this.analytics.track('timer_page_view');
  }

  ngOnDestroy(): void {
    this.timer.dispose();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.isTyping(event)) return;
    if (event.code === 'Escape') {
      event.preventDefault();
      this.timer.reset();
      return;
    }
    if (event.code !== 'Space' || event.repeat) return;
    event.preventDefault();
    this.timer.handleInput();
  }

  onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.timer.handleInput();
  }

  format(ms: number): string {
    return formatMs(ms);
  }

  statCards(): { label: string; value: string }[] {
    const stats = this.timer.stats();
    return [
      { label: 'Best', value: stats.bestMs === null ? '—' : this.format(stats.bestMs) },
      { label: 'Mean', value: stats.meanMs === null ? '—' : this.format(stats.meanMs) },
      { label: 'ao5', value: stats.ao5Ms === null ? '—' : this.format(stats.ao5Ms) },
      { label: 'ao12', value: stats.ao12Ms === null ? '—' : this.format(stats.ao12Ms) },
    ];
  }

  primaryLabel(): string {
    if (this.timer.state() === 'running') return 'Stop';
    if (this.timer.state() === 'inspection') return 'Start solve';
    return this.timer.inspectionEnabled() ? 'Start inspection' : 'Start solve';
  }

  primaryIcon(): string {
    if (this.timer.state() === 'running') return 'stop';
    return 'play_arrow';
  }

  async copyScramble(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.timer.scramble());
      this.copied.set(true);
      this.analytics.track('scramble_copied');
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      this.copied.set(false);
    }
  }

  private isTyping(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    return !!target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
  }
}
