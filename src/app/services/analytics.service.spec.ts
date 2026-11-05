import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalyticsService);
  });

  it('should record events and counts', () => {
    service.track('landing_view');
    service.track('timer_start');
    service.track('timer_start');
    expect(service.count('timer_start')).toBe(2);
    expect(service.events().length).toBe(3);
  });

  it('should report unique sessions', () => {
    service.track('landing_view');
    expect(service.uniqueSessions()).toBe(1);
  });

  it('should clear events', () => {
    service.track('landing_view');
    service.clear();
    expect(service.events().length).toBe(0);
  });
});
