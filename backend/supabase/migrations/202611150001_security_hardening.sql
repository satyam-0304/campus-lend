-- Migration: 202611150001_security_hardening.sql
-- Description: Locks down direct client modification of OTP and email verification status,
--              protects profiles.is_email_verified, and enforces user-scoped storage policies.

-- 1. Drop client UPDATE policy on user_otp_verifications so only serviceClient can verify accounts
DROP POLICY IF EXISTS "user_otp_verifications_update_own" ON public.user_otp_verifications;

-- Ensure SELECT policy exists for users to check their own status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_otp_verifications' AND policyname = 'user_otp_verifications_select_own'
  ) THEN
    CREATE POLICY "user_otp_verifications_select_own" ON public.user_otp_verifications
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 2. Database trigger preventing authenticated/anon roles from modifying is_email_verified directly on profiles
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

-- 3. Storage policies for item-images bucket (user-scoped folder uploads)
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

-- 4. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
