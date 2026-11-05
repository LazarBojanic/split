import { Opponent } from '../models/room.model';

export interface OpponentSeed {
  name: string;
  averageMs: number;
  country: string;
  accent: string;
  anonymous?: boolean;
}

export const OPPONENT_SEEDS: OpponentSeed[] = [
  { name: 'Luka P.', averageMs: 7480, country: 'RS', accent: '#4338ca' },
  { name: 'Mina', averageMs: 8120, country: 'RS', accent: '#be185d' },
  { name: 'anonymous_cuber', averageMs: 9230, country: '—', accent: '#0f766e', anonymous: true },
  { name: 'Vuk', averageMs: 10110, country: 'RS', accent: '#b45309' },
  { name: 'solver_07', averageMs: 11220, country: '—', accent: '#7c3aed', anonymous: true },
  { name: 'Ana', averageMs: 12340, country: 'HR', accent: '#0369a1' },
  { name: 'Nina', averageMs: 15210, country: 'RS', accent: '#be123c' },
  { name: 'Stefan', averageMs: 18450, country: 'RS', accent: '#6d28d9' },
];

export function createOpponent(targetMs: number): Opponent {
  const seed = OPPONENT_SEEDS[Math.floor(Math.random() * OPPONENT_SEEDS.length)];
  return {
    id: `opp-${seed.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`,
    name: seed.name,
    averageMs: seed.averageMs,
    targetMs,
    country: seed.country,
    accent: seed.accent,
    anonymous: seed.anonymous ?? false,
  };
}
