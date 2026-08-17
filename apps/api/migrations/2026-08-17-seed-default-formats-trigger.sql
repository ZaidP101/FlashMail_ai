-- Seed: default formats for every new user via a trigger on auth.users
-- Run in Supabase SQL Editor AFTER 2026-07-31-formats.sql (the formats table must exist).
--
-- Fires on EVERY signup path (API, dashboard, anywhere) and inserts 3 per-user
-- default formats so each user gets their own editable/deletable copies
-- (no shared rows, so edits never conflict between users).
-- Existing users are untouched; the trigger only fires on new inserts.

create or replace function public.seed_default_formats()
returns trigger
language plpgsql
security definer  -- runs as table owner, bypasses RLS so new users can be written for
as $$
begin
  insert into public.formats (user_id, name, mode, tone, content)
  values
    (
      NEW.id,
      'Formal Reply',
      'reply',
      'Formal',
      'Compose a formal, professional reply to the original email. Greet the sender politely, address every point they raised in order, and close with a courteous sign-off. Do not use contractions.'
    ),
    (
      NEW.id,
      'Casual Reply',
      'reply',
      'Casual',
      'Write a friendly, casual reply. Keep it short and warm, use natural everyday language, and respond directly to what the sender said. No corporate jargon.'
    ),
    (
      NEW.id,
      'Cold Outreach Email',
      'email',
      'Professional',
      'Write a professional cold outreach email. Start with a clear subject-free opening, introduce who you are, state the value you offer, include a specific call to action, and keep it under 150 words.'
    );
  return NEW;
end;
$$;

create trigger on_user_signup
  after insert on auth.users
  for each row execute function public.seed_default_formats();
