# Split

Split is a collaborative speedcubing timer prototype: solo timing, a live head-to-head race
(Wizard-of-Oz simulated opponent), an anonymous leaderboard, a website feedback form, and a
Supabase-backed research dashboard.

## Routes

- `/` — landing page
- `/timer` — solo timer, inspection, scrambles, ao5/ao12
- `/live` — live race (simulated opponent, revealed after the race)
- `/leaderboard` — prototype leaderboard
- `/feedback` — website feedback form
- `/privacy` — privacy note
- `/research` — Supabase/local aggregate dashboard

## Supabase

See `../docs/SUPABASE_SETUP.md` for the full setup. Short version:

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy the Project URL and anon public key.
4. Put them in `.env`.
5. Run `pnpm start` or `pnpm build` to regenerate `src/app/config.ts`.

The website feedback form and analytics events are inserted into Supabase when configured.
The public dashboard reads only the aggregate `dashboard_summary()` RPC. Raw feedback text stays
in the Supabase Table Editor.

## Run

```bash
pnpm install
pnpm start
```

Open `http://localhost:4200/`.

## Build and test

```bash
pnpm build
pnpm exec ng test --watch=false
```

## Deploy

The app is a static Angular SPA. Deploy `dist/split/browser` to Vercel, Netlify, or Cloudflare Pages.
For SPA routing, rewrite all unknown paths to `index.html`. Add `SUPABASE_URL` and
`SUPABASE_ANON_KEY` to the host environment variables.

## Notes

- No login, no cookies, no payment.
- The app uses a random localStorage session ID for anonymous events.
- The analytics tables do not store IP addresses.
- Live races are a Wizard-of-Oz test: the opponent is simulated and the result screen debriefs the participant.
- If Supabase is not configured, the feedback form saves locally and the dashboard shows local fallback data.
