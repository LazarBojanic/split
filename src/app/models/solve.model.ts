export type CubeEvent = '3x3' | '2x2' | '4x4';
export type Penalty = 'none' | '+2' | 'DNF';

export interface Solve {
  id: string;
  event: CubeEvent;
  rawTimeMs: number;
  penalty: Penalty;
  timeMs: number;
  scramble: string;
  source: 'solo' | 'race';
  createdAt: string;
}

export interface SessionStats {
  count: number;
  dnfCount: number;
  bestMs: number | null;
  meanMs: number | null;
  ao5Ms: number | null;
  ao12Ms: number | null;
}
