import { CubeEvent } from './solve.model';

export interface LeaderboardEntry {
  id: string;
  name: string;
  event: CubeEvent;
  bestMs: number;
  ao5Ms: number;
  ao12Ms: number | null;
  country: string;
  server: string;
  accent: string;
  anonymous?: boolean;
  updatedAt: string;
}
