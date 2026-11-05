import { Penalty } from './solve.model';

export type RacePhase =
  | 'idle'
  | 'matching'
  | 'lobby'
  | 'scramble'
  | 'inspection'
  | 'racing'
  | 'finished';

export interface Opponent {
  id: string;
  name: string;
  averageMs: number;
  targetMs: number;
  country: string;
  accent: string;
  anonymous: boolean;
}

export interface RaceResult {
  yourRawTimeMs: number;
  yourPenalty: Penalty;
  yourTimeMs: number;
  opponentTimeMs: number;
  opponentName: string;
  won: boolean;
  marginMs: number;
  dnf: boolean;
  simulated: boolean;
}
