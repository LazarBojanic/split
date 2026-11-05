import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Privacy</h1>
        <p class="mt-1 text-sm text-slate-500">Plain-language note for this student research prototype.</p>
      </div>

      <mat-card>
        <mat-card-content class="flex flex-col gap-4 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 class="text-base font-semibold text-slate-900">What we collect</h2>
            <p class="mt-1">
              Anonymous usage events: page views, timer starts/stops, race actions, and which
              feedback button you click. Each event includes a random session ID stored in your
              browser, the page path, and non-personal properties such as the event name.
            </p>
            <p class="mt-2">
              Optional feedback: only the answers you type into the feedback form. The name and
              Discord handle fields are optional.
            </p>
          </section>

          <section>
            <h2 class="text-base font-semibold text-slate-900">What we do not collect</h2>
            <ul class="mt-1 list-disc space-y-1 pl-5">
              <li>No login, account, or password.</li>
              <li>No cookies.</li>
              <li>No IP addresses stored in our analytics tables.</li>
              <li>No names or emails required to use the timer, race, or leaderboard.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-base font-semibold text-slate-900">Why we collect it</h2>
            <p class="mt-1">
              To understand whether the timer and live race are useful, where people get stuck,
              and which features matter. The data is used for a university project and product
              validation, not advertising.
            </p>
          </section>

          <section>
            <h2 class="text-base font-semibold text-slate-900">Where it is stored</h2>
            <p class="mt-1">
              In a Supabase Postgres database controlled by the project owner. The website does
              not use Supabase Auth, so no login session or cookie is created. Standard hosting
              logs may exist at the infrastructure provider level.
            </p>
          </section>

          <section>
            <h2 class="text-base font-semibold text-slate-900">Your choice</h2>
            <p class="mt-1">
              Feedback is optional. If you want your feedback removed, contact the project owner
              with the approximate time you submitted it.
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <a mat-flat-button color="primary" routerLink="/feedback">Give feedback</a>
            </div>
          </section>
        </mat-card-content>
      </mat-card>

      <a routerLink="/" class="text-sm font-medium text-indigo-700 no-underline">← Back to Split</a>
    </div>
  `,
})
export class PrivacyComponent {}
