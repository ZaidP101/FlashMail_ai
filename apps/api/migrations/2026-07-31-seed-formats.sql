-- Seed: dummy formats for the test user
-- Run in Supabase SQL Editor AFTER 2026-07-31-seed-users.sql.
-- user_id matches the test user (test@flashmail.ai / test123456).

insert into public.formats (user_id, name, mode, tone, content)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'Formal Reply',
    'reply',
    'Formal',
    'Compose a formal, professional reply to the original email. Greet the sender politely, address every point they raised in order, and close with a courteous sign-off. Do not use contractions.'
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    'Casual Reply',
    'reply',
    'Casual',
    'Write a friendly, casual reply. Keep it short and warm, use natural everyday language, and respond directly to what the sender said. No corporate jargon.'
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    'Cold Outreach Email',
    'email',
    'Professional',
    'Write a professional cold outreach email. Start with a clear subject-free opening, introduce who you are, state the value you offer, include a specific call to action, and keep it under 150 words.'
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    'Meeting Request',
    'email',
    'Polite',
    'Write a polite meeting request email. Propose 2-3 concrete time options, state the meeting purpose in one line, and ask the recipient to confirm a time that suits them.'
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    'Apology Format',
    'reply',
    'Apologetic',
    'Write a sincere apology reply. Acknowledge the mistake directly, explain briefly what went wrong without making excuses, state how you will fix it, and offer reassurance going forward.'
  );
