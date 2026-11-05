import { TestBed } from '@angular/core/testing';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeedbackService);
  });

  it('should save locally when Supabase is not configured', async () => {
    const result = await service.submit({
      name: 'anonymous_cuber',
      discord: '',
      level: 'sub-20',
      currentTimer: 'csTimer',
      perceivedSpeed: 5,
      opponentFeltReal: 'unsure',
      favoriteFeatures: ['Live races', 'No login'],
      planChoice: 'supporter',
      fairPrice: '$2/month',
      openFeedback: 'Fast and simple.',
      consent: true,
    });

    expect(result.ok).toBe(true);
    expect(result.remote).toBe(false);
    expect(service.entries().length).toBe(1);
    expect(service.entries()[0].planChoice).toBe('supporter');
  });

  it('should clear local entries', async () => {
    await service.submit({
      name: 'cuber',
      discord: '',
      level: 'beginner',
      currentTimer: '',
      perceivedSpeed: 3,
      opponentFeltReal: 'unsure',
      favoriteFeatures: [],
      planChoice: 'free',
      fairPrice: '',
      openFeedback: '',
      consent: true,
    });
    service.clear();
    expect(service.entries().length).toBe(0);
  });
});
