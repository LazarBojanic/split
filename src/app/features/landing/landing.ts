import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AnalyticsService } from '../../services/analytics.service';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  note?: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  template: `
    <div class="flex flex-col gap-12 pb-12">
      <section class="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="flex flex-col items-start gap-4">
          <mat-chip-set>
            <mat-chip highlighted>Research prototype · no account needed</mat-chip>
          </mat-chip-set>
          <h1 class="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Race cubers live.<br />
            Time every solve.
          </h1>
          <p class="max-w-xl text-lg leading-relaxed text-slate-600">
            Split is a fast, anonymous speedcubing timer with live head-to-head races
            and community leaderboards. No login. No ecosystem. Just cube.
          </p>
          <div class="flex flex-wrap gap-2">
            <a mat-flat-button color="primary" routerLink="/timer">
              <mat-icon>play_arrow</mat-icon>
              Start timing
            </a>
            <a mat-stroked-button routerLink="/live">
              <mat-icon>bolt</mat-icon>
              Race someone
            </a>
            <a mat-button routerLink="/feedback">
              <mat-icon>rate_review</mat-icon>
              Give feedback
            </a>
          </div>
          <p class="text-sm text-slate-600">
            Feedback takes about 2 minutes. <strong>No login. Completely anonymous.</strong>
          </p>
          <p class="text-sm text-slate-500">
            Anonymous by default. If you want a name, you can set one later.
          </p>
        </div>

        <mat-card>
          <mat-card-content>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <mat-icon class="text-indigo-700">av_timer</mat-icon>
                3x3 · solo
              </div>
              <mat-chip-set>
                <mat-chip>anonymous</mat-chip>
              </mat-chip-set>
            </div>

            <div class="mt-4 bg-slate-900 p-5 text-white">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Scramble</p>
              <p class="mt-1 font-mono text-sm leading-relaxed text-slate-200">
                R U2 F' L D2 B R2 U' F2 D L' B2 R' U2 F D2 L2 B' U R2
              </p>
              <p class="timer-display mt-6 text-center text-6xl font-bold">12.847</p>
              <p class="mt-2 text-center text-xs text-slate-400">
                Space or tap: inspect → start → stop
              </p>
            </div>

            <div class="mt-4 flex items-center justify-between border border-slate-200 p-3">
              <div class="flex items-center gap-3">
                <mat-icon class="text-slate-500">person</mat-icon>
                <div>
                  <p class="text-sm font-semibold text-slate-800">Luka P. is racing</p>
                  <p class="text-xs text-slate-500">ao5 7.48s · Cubing Lounge</p>
                </div>
              </div>
              <span class="text-sm font-semibold text-pink-700">live</span>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <section class="grid gap-4 sm:grid-cols-3">
        @for (problem of problems; track problem.title) {
          <mat-card>
            <mat-card-content>
              <mat-icon class="text-indigo-700">{{ problem.icon }}</mat-icon>
              <h2 class="mt-2 text-base font-semibold text-slate-900">{{ problem.title }}</h2>
              <p class="mt-1 text-sm leading-relaxed text-slate-600">{{ problem.body }}</p>
            </mat-card-content>
          </mat-card>
        }
      </section>

      <section>
        <div class="max-w-2xl">
          <p class="text-xs font-semibold uppercase tracking-wide text-indigo-700">What you get</p>
          <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            A timer that is built for racing, not for a dashboard.
          </h2>
        </div>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (feature of features; track feature.title) {
            <mat-card>
              <mat-card-content>
                <mat-icon class="text-indigo-700">{{ feature.icon }}</mat-icon>
                <h3 class="mt-2 text-sm font-semibold text-slate-900">{{ feature.title }}</h3>
                <p class="mt-1 text-sm leading-relaxed text-slate-600">{{ feature.body }}</p>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </section>

      <mat-card>
        <mat-card-content>
          <div class="grid gap-6 sm:grid-cols-3">
            @for (step of steps; track step.title; let index = $index) {
              <div>
                <p class="text-sm font-semibold text-indigo-700">Step {{ index + 1 }}</p>
                <h3 class="mt-1 text-sm font-semibold text-slate-900">{{ step.title }}</h3>
                <p class="mt-1 text-sm leading-relaxed text-slate-600">{{ step.body }}</p>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>

      <section id="pricing" #pricing class="scroll-mt-24">
        <div class="max-w-2xl">
          <p class="text-xs font-semibold uppercase tracking-wide text-indigo-700">Pricing question</p>
          <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            We are not selling anything yet.
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">
            Look at the plans and tell us which one you would honestly pick. There is no checkout
            and no payment.
          </p>
        </div>

        <div class="mt-4 grid gap-4 md:grid-cols-3">
          @for (plan of plans; track plan.id) {
            <mat-card>
              <mat-card-content>
                <div class="flex items-center justify-between gap-2">
                  <h3 class="text-base font-semibold text-slate-900">{{ plan.name }}</h3>
                  @if (plan.id === 'supporter') {
                    <mat-chip-set><mat-chip highlighted>most likely</mat-chip></mat-chip-set>
                  }
                </div>
                <p class="mt-3 text-3xl font-bold text-slate-900">
                  {{ plan.price }}
                  <span class="text-sm font-normal text-slate-500">{{ plan.period }}</span>
                </p>
                <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ plan.description }}</p>
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
        </div>

        <mat-card class="mt-4">
          <mat-card-content>
            <p class="text-sm font-semibold text-slate-900">Which would you hypothetically pick?</p>
            <p class="mt-1 text-sm text-slate-600">
              Submit your answer on our feedback form. It takes about 2 minutes,
              requires no login, and is completely anonymous.
            </p>
            <a mat-flat-button color="primary" class="mt-3" routerLink="/feedback">
              <mat-icon>rate_review</mat-icon>
              Submit your answer on the website
            </a>

          </mat-card-content>
        </mat-card>
      </section>

      <mat-card>
        <mat-card-content class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Testing with a cubing Discord server?</h2>
            <p class="mt-1 max-w-2xl text-sm text-slate-600">
              The most useful feedback is two minutes of your time after a solve or a race.
              No login. Completely anonymous.
            </p>
          </div>
          <a mat-stroked-button routerLink="/feedback">
            <mat-icon>rate_review</mat-icon>
            Give feedback
          </a>
        </mat-card-content>
      </mat-card>

      <section class="max-w-3xl">
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">FAQ</h2>
        <mat-card class="mt-3">
          <mat-card-content>
            @for (faq of faqs; track faq.q) {
              <details class="border-b border-slate-200 py-3 last:border-b-0">
                <summary class="cursor-pointer text-sm font-semibold text-slate-900">{{ faq.q }}</summary>
                <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ faq.a }}</p>
              </details>
            }
          </mat-card-content>
        </mat-card>
      </section>

    </div>
  `,
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly analytics = inject(AnalyticsService);

  @ViewChild('pricing') private pricing?: ElementRef<HTMLElement>;
  private pricingObserver?: IntersectionObserver;

  readonly problems = [
    {
      icon: 'person_off',
      title: 'Solo timers are lonely',
      body: 'csTimer and CubeDesk are great, but racing a friend means screen sharing and trusting a Discord message.',
    },
    {
      icon: 'sync_problem',
      title: 'Racing is manual',
      body: 'Someone counts down, someone forgets the scramble, and the result is a screenshot in a chat.',
    },
    {
      icon: 'devices',
      title: 'Stats are scattered',
      body: 'One timer on desktop, one on mobile, a hardware timer on the desk. Nothing talks to anything.',
    },
  ];

  readonly features = [
    {
      icon: 'av_timer',
      title: 'Fast solo timer',
      body: 'Spacebar control, WCA-style inspection, a scramble, and ao5/ao12 without an account.',
    },
    {
      icon: 'bolt',
      title: 'Live head-to-head',
      body: 'A room link, a synchronized 15s inspection, and the same scramble for both cubers.',
    },
    {
      icon: 'leaderboard',
      title: 'Community leaderboard',
      body: 'Global, server, and anonymous rankings. Skill-based, not pay-to-win.',
    },
    {
      icon: 'visibility_off',
      title: 'Anonymous by default',
      body: 'No login, no profile wall, no ecosystem. Race, get a time, leave if you want.',
    },
  ];

  readonly steps = [
    { title: 'Open the timer', body: 'No signup. The timer is ready on the first screen.' },
    { title: 'Race or solve', body: 'Start a solo solve or tap “Race someone” for a live room.' },
    { title: 'Give anonymous feedback', body: 'Two minutes on the website form. No login, no account.' },
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

  readonly faqs = [
    {
      q: 'Do I need an account?',
      a: 'No. Split generates an anonymous display name for you. You can change it later if you want a profile name.',
    },
    {
      q: 'Is the live race real?',
      a: 'The live race is a research prototype used to test the racing experience. Some races may be simulated while we validate the idea. The feedback form asks what felt real and what did not.',
    },
    {
      q: 'Does it work with a physical timer?',
      a: 'Not yet. Stackmat, Gan, and QiYi support is on the roadmap. The first version focuses on the web timer and the racing experience.',
    },
    {
      q: 'Will there be ads or a subscription?',
      a: 'No payment is collected in this prototype. The pricing section is a research question: Free, Supporter $2/month, or Patron $10/month.',
    },
  ];

  ngOnInit(): void {
    this.analytics.track('landing_view');
  }

  ngAfterViewInit(): void {
    if (!this.pricing || typeof IntersectionObserver === 'undefined') return;
    this.pricingObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.analytics.track('pricing_view');
          this.pricingObserver?.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    this.pricingObserver.observe(this.pricing.nativeElement);
  }

  ngOnDestroy(): void {
    this.pricingObserver?.disconnect();
  }
}
