-- Migration: 202611150001_security_hardening.sql
-- Description: Creates user_otp_verifications table if missing, locks down direct client modification
--              of OTP/email verification status, protects profiles.is_email_verified,
--              and enforces user-scoped storage policies.

-- 1. Ensure is_email_verified column exists on public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT false;

-- 2. Create user_otp_verifications table if not already created
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

-- 4. Drop direct client UPDATE policy so only backend serviceClient can verify accounts
DROP POLICY IF EXISTS "user_otp_verifications_update_own" ON public.user_otp_verifications;

-- 5. Ensure SELECT policy exists so logged-in users can check their own verification status
DROP POLICY IF EXISTS "user_otp_verifications_select_own" ON public.user_otp_verifications;
CREATE POLICY "user_otp_verifications_select_own" ON public.user_otp_verifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 6. Database trigger preventing authenticated or anon roles from directly modifying is_email_verified on profiles
CREATE OR REPLACE FUNCTION public.protect_email_verified_flag()
RETURNS trigger AS $$
BEGIN
  IF (NEW.is_email_verified IS DISTINCT FROM OLD.is_email_verified) 
     AND (current_user = 'authenticated' OR current_user = 'anon') THEN
    RAISE EXCEPTION 'Access Denied: is_email_verified can only be modified by the authentication server';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_email_verified ON public.profiles;
CREATE TRIGGER trg_protect_email_verified
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_email_verified_flag();

-- 7. Enforce user-scoped folder upload policies on storage.objects for item-images bucket
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('item-images', 'item-images', true)
    ON CONFLICT (id) DO UPDATE SET public = true;

    DROP POLICY IF EXISTS "item_images_authenticated_insert" ON storage.objects;
    DROP POLICY IF EXISTS "item_images_public_read" ON storage.objects;

    CREATE POLICY "item_images_authenticated_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'item-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );

    CREATE POLICY "item_images_public_read" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'item-images');
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
  WHEN insufficient_privilege THEN
    NULL;
END $$;

-- 8. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
