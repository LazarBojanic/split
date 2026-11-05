export type CubingLevel = 'beginner' | 'sub-30' | 'sub-20' | 'sub-15' | 'sub-10';
export type PracticeFrequency = 'daily' | 'few-times-a-week' | 'weekly' | 'less';
export type MainTimerIntent = 'yes' | 'maybe' | 'no';
export type PlanChoice = 'free' | 'supporter' | 'patron';

export interface FeedbackEntry {
  id: string;
  name: string;
  discord: string;
  level: CubingLevel;
  practiceFrequency: PracticeFrequency;
  currentTimer: string;
  perceivedSpeed: number;
  opponentFeltReal: 'yes' | 'no' | 'unsure';
  mainTimerIntent: MainTimerIntent;
  favoriteFeatures: string[];
  planChoice: PlanChoice;
  openFeedback: string;
  consent: boolean;
  createdAt: string;
}
