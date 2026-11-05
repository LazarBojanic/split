import { Injectable, computed, inject, signal } from '@angular/core';
import { Opponent, RacePhase, RaceResult } from '../models/room.model';
import { Penalty } from '../models/solve.model';
import { createOpponent } from '../mock-data/mock-opponents';
import { AnalyticsService } from './analytics.service';
import { IdentityService } from './identity.service';
import { LeaderboardService } from './leaderboard.service';
import { ScrambleService } from './scramble.service';
import { TimerService } from './timer.service';

const INSPECTION_MS = 15000;
const INSPECTION_GRACE_MS = 2000;

@Injectable({ providedIn: 'root' })
export class RaceService {
  private readonly analytics = inject(AnalyticsService);
  private readonly identity = inject(IdentityService);
  private readonly leaderboard = inject(LeaderboardService);
  private readonly scrambles = inject(ScrambleService);
  private readonly timer = inject(TimerService);

  private readonly _phase = signal<RacePhase>('idle');
  private readonly _opponent = signal<Opponent | null>(null);
  private readonly _yourMs = signal(0);
  private readonly _opponentMs = signal(0);
  private readonly _result = signal<RaceResult | null>(null);
  private readonly _debriefVisible = signal(false);
  private readonly _youReady = signal(false);
  private readonly _opponentReady = signal(false);
  private readonly _youConfirmed = signal(false);
  private readonly _opponentConfirmed = signal(false);
  private readonly _scramble = signal('');
  private readonly _statusLine = signal('');
  private readonly _youFinished = signal(false);
  private readonly _inspectionElapsedMs = signal(0);

  readonly phase = this._phase.asReadonly();
  readonly opponent = this._opponent.asReadonly();
  readonly yourMs = this._yourMs.asReadonly();
  readonly opponentMs = this._opponentMs.asReadonly();
  readonly result = this._result.asReadonly();
  readonly debriefVisible = this._debriefVisible.asReadonly();
  readonly youReady = this._youReady.asReadonly();
  readonly opponentReady = this._opponentReady.asReadonly();
  readonly youConfirmed = this._youConfirmed.asReadonly();
  readonly opponentConfirmed = this._opponentConfirmed.asReadonly();
  readonly scramble = this._scramble.asReadonly();
  readonly statusLine = this._statusLine.asReadonly();
  readonly youFinished = this._youFinished.asReadonly();
  readonly inspectionElapsedMs = this._inspectionElapsedMs.asReadonly();

  readonly inspectionLeftMs = computed(() => INSPECTION_MS - this._inspectionElapsedMs());
  readonly inspectionPenalty = computed<Penalty>(() => {
    if (this._phase() !== 'inspection') return 'none';
    return this.penaltyForInspection(this._inspectionElapsedMs());
  });
  readonly canStop = computed(
    () => this._phase() === 'racing' && !this._youFinished() && this._result() === null,
  );

  private matchingTimeout: number | null = null;
  private readyTimeout: number | null = null;
  private confirmTimeout: number | null = null;
  private inspectionId: number | null = null;
  private rafId: number | null = null;
  private inspectionStart = 0;
  private raceStart = 0;
  private yourFinished = false;
  private opponentFinished = false;
  private yourRawTimeMs = 0;
  private yourPenalty: Penalty = 'none';
  private opponentTargetMs = 0;
  private yourSolveId: string | null = null;

  findMatch(): void {
    if (this._phase() === 'matching' || this._phase() === 'racing') return;
    this.reset();
    this._phase.set('matching');
    this._statusLine.set('Finding a cuber at a similar pace...');
    this.analytics.track('race_matching');

    const base = this.timer.stats().meanMs ?? 15000;
    const target = Math.round(
      Math.min(45000, Math.max(8000, base * (0.85 + Math.random() * 0.3))),
    );

    this.matchingTimeout = window.setTimeout(
      () => {
        const opponent = createOpponent(target);
        this._opponent.set(opponent);
        this._phase.set('lobby');
        this._statusLine.set(`${opponent.name} joined the room.`);
        this.analytics.track('race_matched', {
          opponent: opponent.name,
          anonymous: opponent.anonymous,
        });
      },
      900 + Math.random() * 900,
    );
  }

  ready(): void {
    if (this._phase() !== 'lobby' || this._youReady()) return;
    this._youReady.set(true);
    this.analytics.track('race_ready');
    this.startScramble();

    this.readyTimeout = window.setTimeout(() => {
      this._opponentReady.set(true);
      this._statusLine.set('Your opponent is ready. Scramble the cube.');
    }, 600 + Math.random() * 500);

    this.confirmTimeout = window.setTimeout(() => {
      this._opponentConfirmed.set(true);
      this.analytics.track('race_opponent_scrambled');
      this.maybeStartInspection();
    }, 1200 + Math.random() * 900);
  }

  confirmScrambled(): void {
    if (this._phase() !== 'scramble' || this._youConfirmed()) return;
    this._youConfirmed.set(true);
    this._statusLine.set('Waiting for your opponent to confirm the scramble...');
    this.analytics.track('race_you_scrambled');
    this.maybeStartInspection();
  }

  handleInput(): void {
    if (this._phase() === 'inspection') {
      this.startRace();
    } else if (this._phase() === 'racing') {
      this.stopYourTimer();
    }
  }

  stopYourTimer(): void {
    if (this._phase() !== 'racing' || this.yourFinished) return;
    this.yourFinished = true;
    this._youFinished.set(true);
    this.yourRawTimeMs = performance.now() - this.raceStart;
    this._yourMs.set(
      this.yourPenalty === '+2' ? this.yourRawTimeMs + 2000 : this.yourRawTimeMs,
    );
    const solve = this.timer.recordSolve(
      this.yourRawTimeMs,
      this._scramble(),
      'race',
      this.yourPenalty,
    );
    this.yourSolveId = solve.id;
    this.analytics.track('race_you_finished', {
      rawTimeMs: Math.round(this.yourRawTimeMs),
      penalty: this.yourPenalty,
    });
    if (this.opponentFinished) this.finishRace();
  }

  setResultPenalty(penalty: Penalty): void {
    const result = this._result();
    const opponent = this._opponent();
    if (!result || !opponent || !this.yourSolveId) return;

    this.yourPenalty = penalty;
    this.timer.setPenalty(this.yourSolveId, penalty);

    const dnf = penalty === 'DNF';
    const effective =
      penalty === '+2' ? this.yourRawTimeMs + 2000 : this.yourRawTimeMs;
    const won = !dnf && effective <= opponent.targetMs;
    this._result.set({
      ...result,
      yourPenalty: penalty,
      yourTimeMs: effective,
      dnf,
      won,
      marginMs: dnf ? 0 : Math.abs(effective - opponent.targetMs),
    });
    this._statusLine.set(
      dnf
        ? 'DNF — your opponent wins.'
        : won
          ? 'You won the race.'
          : 'Your opponent finished first.',
    );
    this.leaderboard.removeResult(this.identity.name());
    if (!dnf) {
      this.leaderboard.addResult({
        name: this.identity.name(),
        timeMs: effective,
        anonymous: true,
      });
    }
    this.analytics.track('race_result_penalty', { penalty });
  }

  reset(): void {
    this.cancelAll();
    this._phase.set('idle');
    this._opponent.set(null);
    this._yourMs.set(0);
    this._opponentMs.set(0);
    this._result.set(null);
    this._debriefVisible.set(false);
    this._youReady.set(false);
    this._opponentReady.set(false);
    this._youConfirmed.set(false);
    this._opponentConfirmed.set(false);
    this._scramble.set('');
    this._statusLine.set('');
    this._youFinished.set(false);
    this._inspectionElapsedMs.set(0);
    this.yourFinished = false;
    this.opponentFinished = false;
    this.yourRawTimeMs = 0;
    this.yourPenalty = 'none';
    this.opponentTargetMs = 0;
    this.yourSolveId = null;
  }

  dispose(): void {
    this.reset();
  }

  private startScramble(): void {
    this._phase.set('scramble');
    this._scramble.set(this.scrambles.next(20));
    this._youConfirmed.set(false);
    this._opponentConfirmed.set(false);
    this._statusLine.set('Scramble the cube, then confirm when both of you are ready.');
    this.analytics.track('race_scramble');
  }

  private maybeStartInspection(): void {
    if (
      this._phase() !== 'scramble' ||
      !this._youConfirmed() ||
      !this._opponentConfirmed()
    ) {
      return;
    }
    this.startInspection();
  }

  private startInspection(): void {
    this._phase.set('inspection');
    this._inspectionElapsedMs.set(0);
    this.inspectionStart = performance.now();
    this._statusLine.set('15s inspection. Press Space or tap to start your solve.');
    this.analytics.track('race_inspection_start');

    this.inspectionId = window.setInterval(() => {
      this._inspectionElapsedMs.set(performance.now() - this.inspectionStart);
    }, 100);
  }

  private startRace(): void {
    if (this._phase() !== 'inspection') return;
    const opponent = this._opponent();
    if (!opponent) return;

    this.yourPenalty = this.penaltyForInspection(
      performance.now() - this.inspectionStart,
    );
    this.stopInspectionLoop();
    this._phase.set('racing');
    this._yourMs.set(0);
    this._opponentMs.set(0);
    this._youFinished.set(false);
    this.yourFinished = false;
    this.opponentFinished = false;
    this.yourRawTimeMs = 0;
    this.opponentTargetMs = opponent.targetMs;
    this.raceStart = performance.now();
    this.analytics.track('race_start', {
      opponent: opponent.name,
      penalty: this.yourPenalty,
    });
    this.tick();
  }

  private tick(): void {
    if (this._phase() !== 'racing') return;
    const elapsed = performance.now() - this.raceStart;

    if (!this.yourFinished) {
      this._yourMs.set(elapsed);
    }

    const opponentElapsed = Math.min(elapsed, this.opponentTargetMs);
    this._opponentMs.set(opponentElapsed);

    if (!this.opponentFinished && elapsed >= this.opponentTargetMs) {
      this.opponentFinished = true;
      this.analytics.track('race_opponent_finished', {
        timeMs: Math.round(this.opponentTargetMs),
      });
      if (this.yourFinished) {
        this.finishRace();
        return;
      }
    }

    this.rafId = requestAnimationFrame(() => this.tick());
  }

  private finishRace(): void {
    if (this._result()) return;
    this.cancelTick();
    this.stopInspectionLoop();
    const opponent = this._opponent();
    if (!opponent) return;

    const dnf = this.yourPenalty === 'DNF';
    const yourEffective =
      this.yourPenalty === '+2'
        ? this.yourRawTimeMs + 2000
        : this.yourRawTimeMs;
    const won = !dnf && yourEffective <= this.opponentTargetMs;
    const result: RaceResult = {
      yourRawTimeMs: this.yourRawTimeMs,
      yourPenalty: this.yourPenalty,
      yourTimeMs: yourEffective,
      opponentTimeMs: this.opponentTargetMs,
      opponentName: opponent.name,
      won,
      marginMs: dnf ? 0 : Math.abs(yourEffective - this.opponentTargetMs),
      dnf,
      simulated: true,
    };
    this._result.set(result);
    this._phase.set('finished');
    this._debriefVisible.set(true);
    this._statusLine.set(
      dnf ? 'DNF — your opponent wins.' : won ? 'You won the race.' : 'Your opponent finished first.',
    );

    if (!dnf) {
      this.leaderboard.addResult({
        name: this.identity.name(),
        timeMs: yourEffective,
        anonymous: true,
      });
    }
    this.analytics.track('race_finish', {
      won,
      dnf,
      penalty: this.yourPenalty,
      yourTimeMs: Math.round(yourEffective),
      opponentTimeMs: Math.round(this.opponentTargetMs),
      opponent: opponent.name,
    });
  }

  private penaltyForInspection(elapsedMs: number): Penalty {
    if (elapsedMs <= INSPECTION_MS) return 'none';
    if (elapsedMs <= INSPECTION_MS + INSPECTION_GRACE_MS) return '+2';
    return 'DNF';
  }

  private cancelAll(): void {
    if (this.matchingTimeout !== null) {
      clearTimeout(this.matchingTimeout);
      this.matchingTimeout = null;
    }
    if (this.readyTimeout !== null) {
      clearTimeout(this.readyTimeout);
      this.readyTimeout = null;
    }
    if (this.confirmTimeout !== null) {
      clearTimeout(this.confirmTimeout);
      this.confirmTimeout = null;
    }
    this.stopInspectionLoop();
    this.cancelTick();
  }

  private stopInspectionLoop(): void {
    if (this.inspectionId !== null) {
      clearInterval(this.inspectionId);
      this.inspectionId = null;
    }
  }

  private cancelTick(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
