export type CubingLevel = 'beginner' | 'sub-30' | 'sub-20' | 'sub-15' | 'sub-10';
export type PlanChoice = 'free' | 'supporter' | 'patron' | 'undecided';

export interface FeedbackEntry {
  id: string;
  name: string;
  discord: string;
  level: CubingLevel;
  currentTimer: string;
  perceivedSpeed: number;
  opponentFeltReal: 'yes' | 'no' | 'unsure';
  favoriteFeatures: string[];
  planChoice: PlanChoice;
  fairPrice: string;
  openFeedback: string;
  consent: boolean;
  createdAt: string;
}
