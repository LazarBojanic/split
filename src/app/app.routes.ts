import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing';
import { TimerComponent } from './features/timer/timer';
import { LiveComponent } from './features/live/live';
import { LeaderboardComponent } from './features/leaderboard/leaderboard';
import { FeedbackComponent } from './features/feedback/feedback';
import { PrivacyComponent } from './features/privacy/privacy';
import { ResearchComponent } from './features/research/research';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'timer', component: TimerComponent },
  { path: 'live', component: LiveComponent },
  { path: 'leaderboard', component: LeaderboardComponent },
  { path: 'feedback', component: FeedbackComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'research', component: ResearchComponent },
  { path: '**', redirectTo: '' },
];
