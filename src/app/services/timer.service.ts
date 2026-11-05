import { Injectable, computed, inject, signal } from '@angular/core';
import { CubeEvent, Penalty, SessionStats, Solve } from '../models/solve.model';
import { AnalyticsService } from './analytics.service';
import { ScrambleService } from './scramble.service';
import { trimmedAverage } from '../utils/time';

export type TimerState = 'idle' | 'inspection' | 'running' | 'stopped';

const SOLVES_KEY = 'split_solves_v1';
const INSPECTION_KEY = 'split_inspection_enabled_v1';
const INSPECTION_MS = 15000;
const INSPECTION_GRACE_MS = 2000;

@Injectable({ providedIn: 'root' })
export class TimerService {
  private readonly analytics = inject(AnalyticsService);
  private readonly scrambles = inject(ScrambleService);

  private readonly _state = signal<TimerState>('idle');
  private readonly _elapsedMs = signal(0);
  private readonly _inspectionElapsedMs = signal(0);
  private readonly _scramble = signal('');
  private readonly _solves = signal<Solve[]>(this.readSolves());
  private readonly _inspectionEnabled = signal(this.readInspectionEnabled());

  readonly state = this._state.asReadonly();
  readonly elapsedMs = this._elapsedMs.asReadonly();
  readonly inspectionElapsedMs = this._inspectionElapsedMs.asReadonly();
  readonly inspectionEnabled = this._inspectionEnabled.asReadonly();
  readonly scramble = this._scramble.asReadonly();
  readonly solves = this._solves.asReadonly();
  readonly stats = computed<SessionStats>(() => this.computeStats(this._solves()));

  readonly inspectionLeftMs = computed(() => INSPECTION_MS - this._inspectionElapsedMs());
  readonly inspectionPenalty = computed<Penalty>(() => {
    if (this._state() !== 'inspection') return 'none';
    return this.penaltyForInspection(this._inspectionElapsedMs());
  });

  private startTime = 0;
  private inspectionStart = 0;
  private rafId: number | null = null;
  private inspectionId: number | null = null;
  private pendingPenalty: Penalty = 'none';

  constructor() {
    this.newScramble();
  }

  newScramble(event: CubeEvent = '3x3'): void {
    this._scramble.set(this.scrambles.next(event === '3x3' ? 20 : 11));
  }

  setInspectionEnabled(enabled: boolean): void {
    if (this._state() === 'running' || this._state() === 'inspection') return;
    this._inspectionEnabled.set(enabled);
    try {
      localStorage.setItem(INSPECTION_KEY, String(enabled));
    } catch {
      // Keep the in-memory setting.
    }
    this.analytics.track('inspection_toggle', { enabled });
  }

  handleInput(): void {
    if (this._state() === 'running') {
      this.stop();
      return;
    }
    if (this._state() === 'inspection') {
      this.start();
      return;
    }
    if (this._inspectionEnabled()) {
      this.beginInspection();
    } else {
      this.start();
    }
  }

  beginInspection(): void {
    if (this._state() === 'running') return;
    this.stopInspectionLoop();
    this._state.set('inspection');
    this._inspectionElapsedMs.set(0);
    this._elapsedMs.set(0);
    this.pendingPenalty = 'none';
    this.inspectionStart = performance.now();
    this.analytics.track('inspection_start');

    this.inspectionId = window.setInterval(() => {
      this._inspectionElapsedMs.set(performance.now() - this.inspectionStart);
    }, 100);
  }

  start(): void {
    if (this._state() === 'running') return;
    if (this._state() === 'inspection') {
      this.pendingPenalty = this.penaltyForInspection(
        performance.now() - this.inspectionStart,
      );
    } else {
      this.pendingPenalty = 'none';
    }

    this.stopInspectionLoop();
    this._state.set('running');
    this.startTime = performance.now();
    this._elapsedMs.set(0);
    this.analytics.track('timer_start', {
      inspection: this._inspectionEnabled(),
      penalty: this.pendingPenalty,
    });
    this.tick();
  }

  stop(): number | null {
    if (this._state() !== 'running') return null;
    const rawTimeMs = performance.now() - this.startTime;
    this.cancelTick();
    this._elapsedMs.set(rawTimeMs);
    this._state.set('stopped');
    this.recordSolve(rawTimeMs, this._scramble(), 'solo', this.pendingPenalty);
    this.pendingPenalty = 'none';
    return rawTimeMs;
  }

  reset(): void {
    this.cancelTick();
    this.stopInspectionLoop();
    this._state.set('idle');
    this._elapsedMs.set(0);
    this._inspectionElapsedMs.set(0);
    this.pendingPenalty = 'none';
    this.newScramble();
  }

  recordSolve(
    rawTimeMs: number,
    scramble: string,
    source: Solve['source'],
    penalty: Penalty = 'none',
  ): Solve {
    const solve: Solve = {
      id: this.id(),
      event: '3x3',
      rawTimeMs,
      penalty,
      timeMs: this.effectiveTime(rawTimeMs, penalty),
      scramble,
      source,
      createdAt: new Date().toISOString(),
    };
    this._solves.update((solves) => [solve, ...solves].slice(0, 100));
    this.writeSolves();
    this.analytics.track('solve_complete', {
      rawTimeMs: Math.round(rawTimeMs),
      timeMs: Math.round(solve.timeMs),
      penalty,
      source,
    });
    return solve;
  }

  setPenalty(solveId: string, penalty: Penalty): void {
    this._solves.update((solves) =>
      solves.map((solve) =>
        solve.id === solveId
          ? {
              ...solve,
              penalty,
              timeMs: this.effectiveTime(solve.rawTimeMs, penalty),
            }
          : solve,
      ),
    );
    this.writeSolves();
    this.analytics.track('solve_penalty', { penalty });
  }

  clearSolves(): void {
    this._solves.set([]);
    this.writeSolves();
  }

  dispose(): void {
    this.cancelTick();
    this.stopInspectionLoop();
  }

  private tick(): void {
    if (this._state() !== 'running') return;
    this._elapsedMs.set(performance.now() - this.startTime);
    this.rafId = requestAnimationFrame(() => this.tick());
  }

  private penaltyForInspection(elapsedMs: number): Penalty {
    if (elapsedMs <= INSPECTION_MS) return 'none';
    if (elapsedMs <= INSPECTION_MS + INSPECTION_GRACE_MS) return '+2';
    return 'DNF';
  }

  private effectiveTime(rawTimeMs: number, penalty: Penalty): number {
    return penalty === '+2' ? rawTimeMs + 2000 : rawTimeMs;
  }

  private cancelTick(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private stopInspectionLoop(): void {
    if (this.inspectionId !== null) {
      clearInterval(this.inspectionId);
      this.inspectionId = null;
    }
  }

  private computeStats(solves: Solve[]): SessionStats {
    const valid = solves.filter((solve) => solve.penalty !== 'DNF');
    const times = valid.map((solve) => solve.timeMs);
    const last5 = times.slice(0, 5);
    const last12 = times.slice(0, 12);
    return {
      count: solves.length,
      dnfCount: solves.length - valid.length,
      bestMs: times.length ? Math.min(...times) : null,
      meanMs: times.length
        ? Math.round(times.reduce((sum, time) => sum + time, 0) / times.length)
        : null,
      ao5Ms: last5.length >= 5 ? Math.round(trimmedAverage(last5) ?? 0) : null,
      ao12Ms: last12.length >= 12 ? Math.round(trimmedAverage(last12) ?? 0) : null,
    };
  }

  private readSolves(): Solve[] {
    try {
      const raw = localStorage.getItem(SOLVES_KEY);
      if (!raw) return [];
      return (JSON.parse(raw) as Partial<Solve>[]).map((solve) => {
        const rawTimeMs = solve.rawTimeMs ?? solve.timeMs ?? 0;
        const penalty = solve.penalty ?? 'none';
        return {
          id: solve.id ?? this.id(),
          event: solve.event ?? '3x3',
          rawTimeMs,
          penalty,
          timeMs: solve.timeMs ?? this.effectiveTime(rawTimeMs, penalty),
          scramble: solve.scramble ?? '',
          source: solve.source ?? 'solo',
          createdAt: solve.createdAt ?? new Date().toISOString(),
        };
      });
    } catch {
      return [];
    }
  }

  private writeSolves(): void {
    try {
      localStorage.setItem(SOLVES_KEY, JSON.stringify(this._solves()));
    } catch {
      // Keep the in-memory solves.
    }
  }

  private readInspectionEnabled(): boolean {
    try {
      return localStorage.getItem(INSPECTION_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private id(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
