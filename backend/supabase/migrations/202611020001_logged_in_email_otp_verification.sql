-- Migration: Email OTP verification system for logged-in users
-- Creates user_otp_verifications table with SHA-256 hashed OTPs, expiration, attempts, and cooldown

-- 1. Add is_email_verified flag to public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT false;

-- 2. Create user_otp_verifications table
CREATE TABLE IF NOT EXISTS public.user_otp_verifications (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  otp_hash TEXT,
  otp_expires_at TIMESTAMPTZ,
  otp_attempts INTEGER NOT NULL DEFAULT 0,
  otp_last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.user_otp_verifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
DROP POLICY IF EXISTS "user_otp_verifications_select_own" ON public.user_otp_verifications;
CREATE POLICY "user_otp_verifications_select_own" ON public.user_otp_verifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_otp_verifications_update_own" ON public.user_otp_verifications;
CREATE POLICY "user_otp_verifications_update_own" ON public.user_otp_verifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

