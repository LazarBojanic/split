-- Split research backend
-- Run this in the Supabase SQL editor.
--
-- WARNING: this migration is destructive. It drops the research tables and all
-- existing rows, then recreates the current schema from scratch. That keeps this
-- file safe to re-run at any time and means no legacy columns or data remain.

drop function if exists public.dashboard_summary();
drop table if exists public.feedback cascade;
drop table if exists public.events cascade;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path text,
  session_id text not null,
  properties jsonb not null default '{}'::jsonb,
  utm jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  name text,
  discord text,
  level text,
  practice_frequency text,
  current_timer text,
  perceived_speed integer check (perceived_speed between 1 and 5),
  opponent_felt_real text,
  main_timer_intent text,
  favorite_features text[] not null default '{}',
  plan_choice text,
  open_feedback text,
  consent boolean not null default false,
  created_at timestamptz not null default now()
);

create index events_created_at_idx on public.events (created_at desc);
create index events_name_idx on public.events (name);
create index events_session_idx on public.events (session_id);
create index feedback_created_at_idx on public.feedback (created_at desc);

alter table public.events enable row level security;
alter table public.feedback enable row level security;

-- No anon reads. Writes only.
revoke all on public.events from anon;
revoke all on public.feedback from anon;

grant insert on public.events to anon;
grant insert on public.feedback to anon;

create policy "events_insert_anon"
  on public.events
  for insert
  to anon
  with check (true);

create policy "feedback_insert_anon"
  on public.feedback
  for insert
  to anon
  with check (consent = true);

-- Public aggregate-only dashboard. No raw feedback text is exposed.
create or replace function public.dashboard_summary()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'event_count', (select count(*) from public.events),
    'session_count', (select count(distinct session_id) from public.events),
    'feedback_count', (select count(*) from public.feedback),
    'event_counts', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select name, count(*)::int as count
        from public.events
        group by name
        order by count desc
      ) t
    ), '[]'::jsonb),
    'plan_mix', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select plan_choice as value, count(*)::int as count
        from public.feedback
        group by plan_choice
        order by count desc
      ) t
    ), '[]'::jsonb),
    'level_mix', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select level as value, count(*)::int as count
        from public.feedback
        group by level
        order by count desc
      ) t
    ), '[]'::jsonb),
    'practice_mix', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select practice_frequency as value, count(*)::int as count
        from public.feedback
        group by practice_frequency
        order by count desc
      ) t
    ), '[]'::jsonb),
    'main_timer_split', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select main_timer_intent as value, count(*)::int as count
        from public.feedback
        group by main_timer_intent
        order by count desc
      ) t
    ), '[]'::jsonb),
    'opponent_real_split', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select opponent_felt_real as value, count(*)::int as count
        from public.feedback
        group by opponent_felt_real
        order by count desc
      ) t
    ), '[]'::jsonb),
    'average_speed', (
      select round(avg(perceived_speed)::numeric, 2)
      from public.feedback
    ),
    'top_features', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select feature, count(*)::int as count
        from (
          select unnest(favorite_features) as feature
          from public.feedback
        ) f
        group by feature
        order by count desc
        limit 10
      ) t
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.dashboard_summary() from public;
grant execute on function public.dashboard_summary() to anon;
