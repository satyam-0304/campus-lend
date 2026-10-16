-- Migration: Add PEC student academic & residence fields to public.profiles
-- and enforce @pec.edu.in email domain on auth.users

-- 1. Add new columns to public.profiles safely
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS student_id VARCHAR(8) DEFAULT '',
  ADD COLUMN IF NOT EXISTS degree TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS batch_year TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS residence_type TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hostel_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';

-- 2. Update handle_new_user() trigger function to extract metadata populated on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    room_number,
    phone_number,
    student_id,
    degree,
    batch_year,
    branch,
    residence_type,
    hostel_name,
    address
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'room_number', ''),
    COALESCE(new.raw_user_meta_data->>'phone_number', ''),
    COALESCE(new.raw_user_meta_data->>'student_id', ''),
    COALESCE(new.raw_user_meta_data->>'degree', ''),
    COALESCE(new.raw_user_meta_data->>'batch_year', ''),
    COALESCE(new.raw_user_meta_data->>'branch', ''),
    COALESCE(new.raw_user_meta_data->>'residence_type', ''),
    COALESCE(new.raw_user_meta_data->>'hostel_name', ''),
    COALESCE(new.raw_user_meta_data->>'address', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    degree = CASE WHEN profiles.degree = '' THEN EXCLUDED.degree ELSE profiles.degree END,
    batch_year = CASE WHEN profiles.batch_year = '' THEN EXCLUDED.batch_year ELSE profiles.batch_year END,
    branch = CASE WHEN profiles.branch = '' THEN EXCLUDED.branch ELSE profiles.branch END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger on auth.users is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Database-level trigger to strictly block any non-@pec.edu.in registrations
CREATE OR REPLACE FUNCTION public.check_pec_email_domain()
RETURNS trigger AS $$
BEGIN
  IF LOWER(NEW.email) NOT LIKE '%@pec.edu.in' THEN
    RAISE EXCEPTION 'Access denied: Only @pec.edu.in email addresses are permitted.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_pec_domain_trigger ON auth.users;
CREATE TRIGGER enforce_pec_domain_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_pec_email_domain();
