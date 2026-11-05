import { TestBed } from '@angular/core/testing';
import { LeaderboardService } from './leaderboard.service';

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeaderboardService);
  });

  it('should return sorted global 3x3 entries', () => {
    const rows = service.filtered({ scope: 'global', event: '3x3', query: '' });
    expect(rows.length).toBeGreaterThan(5);
    expect(rows[0].bestMs).toBeLessThanOrEqual(rows[rows.length - 1].bestMs);
  });

  it('should add an anonymous local result', () => {
    service.addResult({ name: 'anonymous_test', timeMs: 9000, anonymous: true });
    const rows = service.filtered({ scope: 'global', event: '3x3', query: 'anonymous_test' });
    expect(rows.length).toBe(1);
    expect(rows[0].bestMs).toBe(9000);
  });

  it('should filter by query', () => {
    const rows = service.filtered({ scope: 'global', event: '3x3', query: 'Luka' });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((entry) => entry.name.toLowerCase().includes('luka'))).toBe(true);
  });
});
