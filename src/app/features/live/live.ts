import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RaceService } from '../../services/race.service';
import { IdentityService } from '../../services/identity.service';
import { AnalyticsService } from '../../services/analytics.service';
import { formatMs } from '../../utils/time';

@Component({
  selector: 'app-live',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Live race</h1>
          <p class="text-sm text-slate-500">
            Same scramble, synchronized inspection, head-to-head result.
          </p>
        </div>
        <mat-chip-set>
          <mat-chip highlighted>anonymous · no login</mat-chip>
        </mat-chip-set>
      </div>

      <mat-card class="">
        <mat-card-content class="!p-6">
          @switch (race.phase()) {
            @case ('idle') {
              <div class="flex flex-col items-center py-10 text-center">
                <div class="grid h-16 w-16 place-items-center rounded-full bg-indigo-100 text-indigo-700">
                  <mat-icon class="!text-4xl">bolt</mat-icon>
                </div>
                <h2 class="mt-4 text-xl font-bold text-slate-900">Race a random cuber</h2>
                <p class="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                  You will be matched with someone at a similar pace. No account, no friend
                  request, no lobby to manage.
                </p>
                <button mat-flat-button color="primary" class="mt-5" type="button" (click)="race.findMatch()">
                  <mat-icon>search</mat-icon>
                  Find a match
                </button>
                <p class="mt-4 text-xs text-slate-400">
                  Research prototype. Live races are not production multiplayer yet.
                </p>
              </div>
            }

            @case ('matching') {
              <div class="flex flex-col items-center py-12 text-center">
                <mat-spinner diameter="44"></mat-spinner>
                <h2 class="mt-4 text-lg font-semibold text-slate-900">Finding a cuber...</h2>
                <p class="mt-1 text-sm text-slate-500">{{ race.statusLine() }}</p>
              </div>
            }

            @case ('lobby') {
              @if (race.opponent(); as opponent) {
                <div class="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div class=" border border-slate-200 p-4 text-center">
                    <div class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
                      {{ opponent.name.charAt(0).toUpperCase() }}
                    </div>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ opponent.name }}</p>
                    <p class="text-xs text-slate-500">
                      {{ opponent.country }} · avg {{ format(opponent.averageMs) }}
                    </p>
                  </div>

                  <div class="text-center text-sm font-bold text-slate-400">vs</div>

                  <div class=" border border-slate-200 p-4 text-center">
                    <div class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-lg font-bold text-slate-700">
                      {{ identity.name().charAt(0).toUpperCase() }}
                    </div>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ identity.name() }}</p>
                    <p class="text-xs text-slate-500">you · anonymous</p>
                  </div>
                </div>

                <div class="mt-6 flex flex-col items-center gap-2">
                  <button mat-flat-button color="primary" type="button" (click)="race.ready()">
                    <mat-icon>check</mat-icon>
                    Ready
                  </button>
                  <p class="text-xs text-slate-500">{{ race.statusLine() }}</p>
                </div>
              }
            }

            @case ('scramble') {
              <div class="text-center">
                <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">Scramble</p>
                <p class="mx-auto mt-2 max-w-3xl font-mono text-base leading-relaxed text-slate-900">
                  {{ race.scramble() }}
                </p>
                <p class="mt-3 text-sm text-slate-500">{{ race.statusLine() }}</p>

                <div class="mt-5 grid gap-3 text-left sm:grid-cols-2">
                  <div class=" border border-slate-200 p-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">You</p>
                    <p class="mt-1 text-sm font-medium" [class.text-green-700]="race.youConfirmed()">
                      {{ race.youConfirmed() ? 'Scrambled' : 'Scramble the cube' }}
                    </p>
                  </div>
                  <div class=" border border-slate-200 p-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {{ race.opponent()?.name }}
                    </p>
                    <p class="mt-1 text-sm font-medium" [class.text-green-700]="race.opponentConfirmed()">
                      {{ race.opponentConfirmed() ? 'Scrambled' : 'Scrambling...' }}
                    </p>
                  </div>
                </div>

                <div class="mt-5 flex flex-col items-center gap-2">
                  <button
                    mat-flat-button
                    color="primary"
                    type="button"
                    [disabled]="race.youConfirmed()"
                    (click)="race.confirmScrambled()"
                  >
                    <mat-icon>check</mat-icon>
                    I've scrambled
                  </button>
                  <p class="text-xs text-slate-500">
                    The 15s inspection starts only after both cubers confirm.
                  </p>
                </div>
              </div>
            }

            @case ('inspection') {
              <div class="flex flex-col items-center py-12 text-center">
                <p class="text-sm font-semibold uppercase tracking-wide text-amber-600">Inspection</p>
                @if (race.inspectionLeftMs() >= 0) {
                  <p class="timer-display mt-2 text-7xl font-bold text-amber-600">
                    {{ (race.inspectionLeftMs() / 1000).toFixed(1) }}
                  </p>
                  <p class="mt-2 text-xs text-slate-500">
                    Press Space or tap here to start your solve.
                  </p>
                } @else if (race.inspectionPenalty() === '+2') {
                  <p class="timer-display mt-2 text-7xl font-bold text-orange-500">
                    +{{ ((-race.inspectionLeftMs()) / 1000).toFixed(1) }}
                  </p>
                  <p class="mt-2 text-xs font-semibold text-orange-600">
                    Inspection over by more than 15s — this solve will get +2.
                  </p>
                } @else {
                  <p class="timer-display mt-2 text-7xl font-bold text-red-500">DNF</p>
                  <p class="mt-2 text-xs font-semibold text-red-600">
                    Inspection over by more than 17s — this solve is DNF.
                  </p>
                }

                <div class="mt-5 grid w-full max-w-2xl gap-3 text-left sm:grid-cols-2">
                  <div class=" border border-slate-200 p-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Scramble</p>
                    <p class="mt-1 font-mono text-xs leading-relaxed text-slate-700">{{ race.scramble() }}</p>
                  </div>
                  <div class=" border border-slate-200 p-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {{ race.opponent()?.name }}
                    </p>
                    <p class="mt-1 text-sm text-slate-600">Inspecting...</p>
                    <p class="mt-2 text-xs text-slate-500">
                      Your opponent starts when you start.
                    </p>
                  </div>
                </div>

                <button mat-flat-button color="primary" class="mt-5" type="button" (click)="race.handleInput()">
                  <mat-icon>play_arrow</mat-icon>
                  Start my solve
                </button>
              </div>
            }

            @case ('racing') {
              @if (race.opponent(); as opponent) {
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class=" bg-slate-900 p-5 text-white">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">You</p>
                    <p class="timer-display mt-2 text-5xl font-bold">{{ format(race.yourMs()) }}</p>
                    <p class="mt-2 text-xs text-slate-400">
                      {{ race.canStop() ? 'Press Space or the button when solved.' : 'Finished — waiting for your opponent.' }}
                    </p>
                  </div>
                  <div class=" border border-slate-200 p-5">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {{ opponent.name }}
                    </p>
                    <p class="timer-display mt-2 text-5xl font-bold text-slate-900">
                      {{ format(race.opponentMs()) }}
                    </p>
                    <p class="mt-2 text-xs text-slate-500">
                      {{ race.opponentMs() >= opponent.targetMs ? 'Finished' : 'Solving...' }}
                    </p>
                  </div>
                </div>

                <div class="mt-4 border border-slate-200 p-4">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Scramble</p>
                  <p class="mt-1 font-mono text-sm leading-relaxed text-slate-700">{{ race.scramble() }}</p>
                </div>

                <div class="mt-5 flex justify-center">
                  <button mat-flat-button color="warn" type="button" (click)="race.stopYourTimer()">
                    <mat-icon>stop</mat-icon>
                    Stop my timer
                  </button>
                </div>
              }
            }

            @case ('finished') {
              @if (race.result(); as result) {
                <div class="text-center">
                  <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">Result</p>
                  <h2 class="mt-2 text-3xl font-bold" [class.text-green-700]="result.won" [class.text-pink-700]="!result.won">
                    {{ result.won ? 'You won' : 'You lost' }}
                  </h2>
                  <p class="mt-1 text-sm text-slate-500">
                    @if (result.dnf) {
                      DNF · anonymous room
                    } @else {
                      Margin: {{ format(result.marginMs) }} · anonymous room
                    }
                  </p>

                  <div class="mt-6 grid gap-4 sm:grid-cols-2">
                    <div class=" bg-slate-900 p-5 text-white">
                      <p class="text-xs uppercase tracking-wide text-slate-400">You</p>
                      @if (result.dnf) {
                        <p class="timer-display mt-2 text-4xl font-bold text-red-400">DNF</p>
                        <p class="text-xs text-slate-400">raw {{ format(result.yourRawTimeMs) }}</p>
                      } @else {
                        <p class="timer-display mt-2 text-4xl font-bold">{{ format(result.yourTimeMs) }}</p>
                        @if (result.yourPenalty === '+2') {
                          <p class="text-xs text-orange-300">+2 from {{ format(result.yourRawTimeMs) }}</p>
                        }
                      }
                    </div>
                    <div class=" border border-slate-200 p-5">
                      <p class="text-xs uppercase tracking-wide text-slate-500">{{ result.opponentName }}</p>
                      <p class="timer-display mt-2 text-4xl font-bold text-slate-900">
                        {{ format(result.opponentTimeMs) }}
                      </p>
                    </div>
                  </div>

                  <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <span class="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Mark result:
                    </span>
                    <button
                      mat-stroked-button
                      type="button"
                      [color]="result.yourPenalty === 'none' ? 'primary' : undefined"
                      (click)="race.setResultPenalty('none')"
                    >
                      OK
                    </button>
                    <button
                      mat-stroked-button
                      type="button"
                      [color]="result.yourPenalty === '+2' ? 'primary' : undefined"
                      (click)="race.setResultPenalty('+2')"
                    >
                      +2
                    </button>
                    <button
                      mat-stroked-button
                      type="button"
                      [color]="result.yourPenalty === 'DNF' ? 'warn' : undefined"
                      (click)="race.setResultPenalty('DNF')"
                    >
                      DNF
                    </button>
                  </div>

                  <div class="mt-5 flex flex-wrap justify-center gap-3">
                    <button mat-flat-button color="primary" type="button" (click)="race.findMatch()">
                      <mat-icon>replay</mat-icon>
                      Race again
                    </button>
                    <a mat-stroked-button routerLink="/leaderboard">
                      <mat-icon>leaderboard</mat-icon>
                      Leaderboard
                    </a>
                  </div>
                </div>

                @if (race.debriefVisible()) {
                  <div class="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p class="font-semibold">Research note</p>
                    <p class="mt-1 leading-relaxed">
                      Your opponent in this race was simulated. This is a Wizard-of-Oz test:
                      the app pretends someone is racing you so we can test the experience
                      before building real-time multiplayer.
                    </p>
                    <p class="mt-2">
                      Did it feel real? Tell us in the
                      <a routerLink="/feedback" class="font-semibold underline">anonymous website form</a>.
                      It takes about 2 minutes.
                    </p>
                  </div>
                }
              }
            }
          }
        </mat-card-content>
      </mat-card>

      <div class="grid gap-4 sm:grid-cols-3">
        <mat-card class="">
          <mat-card-content class="!p-4">
            <mat-icon class="text-indigo-700">login</mat-icon>
            <p class="mt-2 text-sm font-semibold text-slate-900">No login</p>
            <p class="text-xs text-slate-500">Anonymous name, no account wall, no friend request.</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="">
          <mat-card-content class="!p-4">
            <mat-icon class="text-indigo-700">timer</mat-icon>
            <p class="mt-2 text-sm font-semibold text-slate-900">15s inspection</p>
            <p class="text-xs text-slate-500">Both cubers confirm the scramble, then inspection starts. Over 15s is +2; over 17s is DNF.</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="">
          <mat-card-content class="!p-4">
            <mat-icon class="text-indigo-700">science</mat-icon>
            <p class="mt-2 text-sm font-semibold text-slate-900">Research prototype</p>
            <p class="text-xs text-slate-500">Live races are still a research prototype, not production multiplayer yet.</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
})
export class LiveComponent implements OnInit, OnDestroy {
  readonly race = inject(RaceService);
  readonly identity = inject(IdentityService);
  private readonly analytics = inject(AnalyticsService);

  ngOnInit(): void {
    this.analytics.track('live_page_view');
  }

  ngOnDestroy(): void {
    this.race.dispose();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Escape') {
      this.race.reset();
      return;
    }
    if (event.code !== 'Space' || event.repeat) return;
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
    if (this.race.phase() === 'inspection' || this.race.phase() === 'racing') {
      event.preventDefault();
      this.race.handleInput();
    }
  }

  format(ms: number): string {
    return formatMs(ms);
  }
}
