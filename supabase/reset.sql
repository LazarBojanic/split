-- Split research backend
-- Run this in the Supabase SQL editor to wipe all test data.
-- Keeps the schema intact so you can keep testing without polluting results.

truncate table public.events, public.feedback;
