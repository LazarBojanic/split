import { TestBed } from '@angular/core/testing';
import { FeedbackService } from './feedback.service';
import { SupabaseService } from './supabase.service';

describe('FeedbackService', () => {
  let service: FeedbackService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SupabaseService,
          useValue: {
            isConfigured: false,
            insertEvents: async () => {},
            insertFeedback: async () => {},
          },
        },
      ],
    });
    service = TestBed.inject(FeedbackService);
  });

  it('should save locally when Supabase is not configured', async () => {
    const result = await service.submit({
      name: 'anonymous_cuber',
      discord: '',
      level: 'sub-20',
      practiceFrequency: 'daily',
      currentTimer: 'csTimer',
      perceivedSpeed: 5,
      opponentFeltReal: 'unsure',
      mainTimerIntent: 'yes',
      favoriteFeatures: ['Live races', 'No login'],
      planChoice: 'supporter',
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
      practiceFrequency: 'less',
      currentTimer: '',
      perceivedSpeed: 3,
      opponentFeltReal: 'unsure',
      mainTimerIntent: 'no',
      favoriteFeatures: [],
      planChoice: 'free',
      openFeedback: '',
      consent: true,
    });
    service.clear();
    expect(service.entries().length).toBe(0);
  });
});
