-- Seed: test user in auth.users (so formats.user_id FK is valid and login works)
-- Run in Supabase SQL Editor AFTER running 2026-07-31-formats.sql.
--
-- Credentials: test@flashmail.ai / test123456
-- Sign in via the web dashboard or extension popup with these.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  recovery_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'test@flashmail.ai',
  crypt('test123456', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Test User"}',
  now(),
  now()
);

-- identity row required for password login to work
insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  gen_random_uuid(),
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  '{"sub": "11111111-1111-4111-8111-111111111111", "email": "test@flashmail.ai", "email_verified": true}',
  'email',
  now(),
  now(),
  now()
);
