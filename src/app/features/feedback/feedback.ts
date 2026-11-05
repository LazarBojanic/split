import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FeedbackService } from '../../services/feedback.service';
import { IdentityService } from '../../services/identity.service';
import { AnalyticsService } from '../../services/analytics.service';
import {
  CubingLevel,
  MainTimerIntent,
  PlanChoice,
  PracticeFrequency,
} from '../../models/feedback.model';

interface Plan {
  id: PlanChoice;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  note?: string;
}

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="mx-auto flex max-w-3xl flex-col gap-6">
      <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Feedback</h1>
          <p class="mt-1 text-sm text-slate-500">
            Website form — the default option. Two minutes, anonymous, no login.
          </p>
        </div>
        <mat-chip-set>
          <mat-chip highlighted>no login · anonymous</mat-chip>
        </mat-chip-set>
      </div>

      <mat-card>
        <mat-card-content class="flex flex-col gap-2">
          <p class="text-sm text-slate-700">
            We collect anonymous usage events (page views, timer/race actions) and the
            feedback you type here. No login. No cookies. No analytics IP storage.
            <a routerLink="/privacy" class="font-semibold text-indigo-700 no-underline">Privacy details</a>.
          </p>
        </mat-card-content>
      </mat-card>

      @if (submitted()) {
        <mat-card>
          <mat-card-content class="text-center">
            <mat-icon class="!text-4xl text-green-700">check_circle</mat-icon>
            <h2 class="mt-2 text-xl font-bold text-slate-900">Thanks — feedback saved.</h2>
            @if (remote()) {
              <p class="mt-2 text-sm text-slate-600">
                Your answers were saved to the research database.
              </p>
            } @else {
              <p class="mt-2 text-sm text-slate-600">
                Your answers were saved locally on this device. The database is not configured
                in this build.
              </p>
            }
            <div class="mt-4 flex flex-wrap justify-center gap-2">
              <a mat-flat-button color="primary" routerLink="/timer">Back to timer</a>
              <a mat-stroked-button routerLink="/live">Try a live race</a>
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <form (ngSubmit)="submit()" class="flex flex-col gap-4">
          <mat-card>
            <mat-card-content>
              <h2 class="text-base font-semibold text-slate-900">About you</h2>
              <div class="mt-3 grid gap-3 sm:grid-cols-2">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Name or anonymous name</mat-label>
                  <input matInput [(ngModel)]="name" name="name" maxlength="24" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Discord handle (optional)</mat-label>
                  <input matInput [(ngModel)]="discord" name="discord" placeholder="name#1234" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>3x3 level</mat-label>
                  <mat-select [(ngModel)]="level" name="level">
                    <mat-option value="beginner">Beginner (over 30s)</mat-option>
                    <mat-option value="sub-30">Sub-30</mat-option>
                    <mat-option value="sub-20">Sub-20</mat-option>
                    <mat-option value="sub-15">Sub-15</mat-option>
                    <mat-option value="sub-10">Sub-10</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>How often do you practice?</mat-label>
                  <mat-select [(ngModel)]="practiceFrequency" name="practiceFrequency">
                    <mat-option value="daily">Daily</mat-option>
                    <mat-option value="few-times-a-week">A few times a week</mat-option>
                    <mat-option value="weekly">About once a week</mat-option>
                    <mat-option value="less">Less often</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Current timer(s)</mat-label>
                  <input matInput [(ngModel)]="currentTimer" name="currentTimer" placeholder="csTimer, CubeDesk, phone..." />
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-content>
              <h2 class="text-base font-semibold text-slate-900">The prototype</h2>

              <div class="mt-4">
                <p class="text-sm font-medium text-slate-800">Rate the app's responsiveness.</p>
                <div class="mt-2 flex flex-wrap items-center gap-3">
                  <span class="text-xs text-slate-500">1 = sluggish</span>
                  <input type="range" min="1" max="5" step="1" [(ngModel)]="perceivedSpeed" name="perceivedSpeed" class="w-full max-w-xs" />
                  <span class="text-xs text-slate-500">5 = instant</span>
                  <span class="text-sm font-semibold text-slate-900">{{ perceivedSpeed }}/5</span>
                </div>
              </div>

              <div class="mt-5">
                <p class="text-sm font-medium text-slate-800">
                  If you raced: did the opponent feel like a real person?
                </p>
                <mat-radio-group [(ngModel)]="opponentFeltReal" name="opponentFeltReal" class="mt-2 flex flex-wrap gap-4">
                  <mat-radio-button value="yes">Yes</mat-radio-button>
                  <mat-radio-button value="no">No</mat-radio-button>
                  <mat-radio-button value="unsure">Did not race / not sure</mat-radio-button>
                </mat-radio-group>
                <p class="mt-1 text-xs text-slate-500">
                  The prototype uses a simulated opponent for the first race test. This is the debrief.
                </p>
              </div>

              <div class="mt-5">
                <p class="text-sm font-medium text-slate-800">
                  Would you use Split as your main timer?
                </p>
                <mat-radio-group [(ngModel)]="mainTimerIntent" name="mainTimerIntent" class="mt-2 flex flex-wrap gap-4">
                  <mat-radio-button value="yes">Yes</mat-radio-button>
                  <mat-radio-button value="maybe">Maybe</mat-radio-button>
                  <mat-radio-button value="no">No</mat-radio-button>
                </mat-radio-group>
              </div>

              <div class="mt-5">
                <p class="text-sm font-medium text-slate-800">Which features matter most? (choose up to 3)</p>
                <div class="mt-2 grid gap-2 sm:grid-cols-2">
                  @for (feature of featureOptions; track feature) {
                    <mat-checkbox
                      [checked]="favoriteFeatures.includes(feature)"
                      (change)="toggleFeature(feature)"
                    >
                      {{ feature }}
                    </mat-checkbox>
                  }
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-content>
              <h2 class="text-base font-semibold text-slate-900">Pricing question</h2>
              <p class="mt-1 text-sm text-slate-500">
                Look at the plans and tell us which one you would honestly pick. There is no
                checkout and no payment.
              </p>
              <mat-radio-group
                [(ngModel)]="planChoice"
                name="planChoice"
                class="mt-4 grid gap-4 md:grid-cols-3"
              >
                @for (plan of plans; track plan.id) {
                  <mat-card
                    class="cursor-pointer transition-shadow hover:shadow-md"
                    [class.ring-2]="planChoice === plan.id"
                    [class.ring-indigo-600]="planChoice === plan.id"
                    (click)="planChoice = plan.id"
                  >
                    <mat-card-content>
                      <div class="flex items-center justify-between gap-2">
                        <mat-radio-button [value]="plan.id">{{ plan.name }}</mat-radio-button>
                        @if (plan.id === 'supporter') {
                          <mat-chip-set><mat-chip highlighted>most likely</mat-chip></mat-chip-set>
                        }
                      </div>
                      <p class="mt-3 text-3xl font-bold text-slate-900">
                        {{ plan.price }}
                        <span class="text-sm font-normal text-slate-500">{{ plan.period }}</span>
                      </p>
                      <p class="mt-2 text-sm leading-relaxed text-slate-600">
                        {{ plan.description }}
                      </p>
                      <ul class="mt-4 space-y-2 text-sm text-slate-700">
                        @for (item of plan.features; track item) {
                          <li class="flex items-start gap-2">
                            <mat-icon class="mt-0.5 text-base text-indigo-700">check</mat-icon>
                            <span>{{ item }}</span>
                          </li>
                        }
                      </ul>
                      @if (plan.note) {
                        <p class="mt-3 text-xs text-slate-500">{{ plan.note }}</p>
                      }
                    </mat-card-content>
                  </mat-card>
                }
              </mat-radio-group>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-content>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Anything else? What felt useful or pointless?</mat-label>
                <textarea matInput rows="4" [(ngModel)]="openFeedback" name="openFeedback"></textarea>
              </mat-form-field>

              <label class="mt-2 flex items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" name="consent" [(ngModel)]="consent" class="mt-1 h-4 w-4" />
                <span>
                  I agree that my anonymous feedback may be used for this student research project.
                </span>
              </label>

              @if (error()) {
                <p class="mt-3 text-sm font-medium text-red-700">{{ error() }}</p>
              }

              <button mat-flat-button color="primary" type="submit" class="mt-4" [disabled]="submitting()">
                <mat-icon>send</mat-icon>
                {{ submitting() ? 'Submitting...' : 'Submit feedback' }}
              </button>
            </mat-card-content>
          </mat-card>
        </form>
      }
    </div>
  `,
})
export class FeedbackComponent implements OnInit {
  private readonly feedback = inject(FeedbackService);
  private readonly identity = inject(IdentityService);
  private readonly analytics = inject(AnalyticsService);
  private readonly route = inject(ActivatedRoute);

  readonly submitted = signal(false);
  readonly remote = signal(false);
  readonly submitting = signal(false);
  readonly error = signal('');

  name = this.identity.name();
  discord = '';
  level: CubingLevel = 'sub-20';
  practiceFrequency: PracticeFrequency = 'few-times-a-week';
  currentTimer = '';
  perceivedSpeed = 4;
  opponentFeltReal: 'yes' | 'no' | 'unsure' = 'unsure';
  mainTimerIntent: MainTimerIntent = 'maybe';
  favoriteFeatures: string[] = ['Live races'];
  planChoice: PlanChoice = 'free';
  openFeedback = '';
  consent = false;

  readonly featureOptions = [
    'Live races',
    'Solo timer',
    'Leaderboard',
    'No login',
    'Hardware timer support',
    'Discord integration',
    'Advanced stats',
    'Profile flair',
  ];

  readonly plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Everything a casual or competitive cuber needs to time and race.',
      features: [
        'Solo timer and scrambles',
        'Basic stats (best, mean, ao5, ao12)',
        'Anonymous live races',
        'Public leaderboard',
      ],
    },
    {
      id: 'supporter',
      name: 'Supporter',
      price: '$2',
      period: 'per month',
      description: 'A small optional tip for people who use it every day.',
      features: [
        'Everything in Free',
        'Profile flair and a custom name',
        'Advanced stats and match history',
        'Private room links',
      ],
      note: 'This is the plan we expect most paying cubers to pick.',
    },
    {
      id: 'patron',
      name: 'Patron',
      price: '$10',
      period: 'per month',
      description: 'For server owners and people who really want to support development.',
      features: [
        'Everything in Supporter',
        'Server leaderboard and admin tools',
        'Tournament/bracket tools',
        'Early access to hardware integrations',
      ],
      note: 'Probably not for a normal cuber. That is what the test is for.',
    },
  ];

  ngOnInit(): void {
    this.analytics.track('feedback_page_view');
    const plan = this.route.snapshot.queryParamMap.get('plan');
    if (plan === 'free' || plan === 'supporter' || plan === 'patron') {
      this.planChoice = plan;
    }
  }

  toggleFeature(feature: string): void {
    const index = this.favoriteFeatures.indexOf(feature);
    if (index >= 0) {
      this.favoriteFeatures.splice(index, 1);
    } else if (this.favoriteFeatures.length < 3) {
      this.favoriteFeatures.push(feature);
    }
  }

  async submit(): Promise<void> {
    this.error.set('');
    if (!this.consent) {
      this.error.set('Please tick the consent box before submitting.');
      return;
    }
    this.submitting.set(true);
    const result = await this.feedback.submit({
      name: this.name.trim() || this.identity.name(),
      discord: this.discord.trim(),
      level: this.level,
      practiceFrequency: this.practiceFrequency,
      currentTimer: this.currentTimer.trim(),
      perceivedSpeed: this.perceivedSpeed,
      opponentFeltReal: this.opponentFeltReal,
      mainTimerIntent: this.mainTimerIntent,
      favoriteFeatures: [...this.favoriteFeatures],
      planChoice: this.planChoice,
      openFeedback: this.openFeedback.trim(),
      consent: true,
    });
    this.submitting.set(false);
    if (result.ok) {
      this.remote.set(result.remote);
      this.submitted.set(true);
    } else {
      this.error.set(result.error ?? 'Could not save feedback.');
    }
  }
}
