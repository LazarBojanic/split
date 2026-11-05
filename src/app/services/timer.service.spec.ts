import { TestBed } from '@angular/core/testing';
import { TimerService } from './timer.service';
import { formatMs, trimmedAverage } from '../utils/time';

describe('TimerService', () => {
  let service: TimerService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimerService);
  });

  afterEach(() => {
    service.dispose();
  });

  it('should start with a scramble and no solves', () => {
    expect(service.scramble().length).toBeGreaterThan(0);
    expect(service.solves().length).toBe(0);
    expect(service.stats().count).toBe(0);
  });

  it('should record solves and compute best/mean/ao5', () => {
    [12000, 14000, 11000, 13000, 15000, 10000].forEach((time) =>
      service.recordSolve(time, 'R U R\'', 'solo'),
    );

    const stats = service.stats();
    expect(stats.count).toBe(6);
    expect(stats.bestMs).toBe(10000);
    expect(stats.meanMs).toBe(12500);
    expect(stats.ao5Ms).not.toBeNull();
    expect(stats.ao12Ms).toBeNull();
  });

  it('should clear solves', () => {
    service.recordSolve(12000, 'R U', 'solo');
    service.clearSolves();
    expect(service.solves().length).toBe(0);
    expect(service.stats().bestMs).toBeNull();
  });

  it('should expose an idle state by default', () => {
    expect(service.state()).toBe('idle');
    expect(service.elapsedMs()).toBe(0);
  });

  it('should use inspection when the switch is on', () => {
    service.setInspectionEnabled(true);
    service.handleInput();
    expect(service.state()).toBe('inspection');
    service.handleInput();
    expect(service.state()).toBe('running');
    service.handleInput();
    expect(service.state()).toBe('stopped');
    expect(service.solves().length).toBe(1);
  });

  it('should apply +2 and DNF penalties', () => {
    const plusTwo = service.recordSolve(10000, 'R U', 'solo', '+2');
    expect(plusTwo.timeMs).toBe(12000);
    service.recordSolve(11000, 'R U', 'solo', 'DNF');
    const stats = service.stats();
    expect(stats.count).toBe(2);
    expect(stats.dnfCount).toBe(1);
    expect(stats.bestMs).toBe(12000);
  });

  it('should let the user mark a solve as +2 or DNF', () => {
    const solve = service.recordSolve(10000, 'R U', 'solo');
    service.setPenalty(solve.id, '+2');
    expect(service.solves()[0].timeMs).toBe(12000);
    service.setPenalty(solve.id, 'DNF');
    expect(service.solves()[0].penalty).toBe('DNF');
    expect(service.stats().bestMs).toBeNull();
    service.setPenalty(solve.id, 'none');
    expect(service.solves()[0].timeMs).toBe(10000);
    expect(service.stats().bestMs).toBe(10000);
  });
});

describe('time utils', () => {
  it('should format minutes correctly', () => {
    expect(formatMs(0)).toBe('0:00.000');
    expect(formatMs(12345)).toBe('0:12.345');
    expect(formatMs(65432)).toBe('1:05.432');
  });

  it('should trim best and worst for an average', () => {
    expect(trimmedAverage([10, 20, 30, 40, 100])).toBe(30);
  });
});
