-- Migration: 202610270002_protect_room_number_privacy.sql
-- Description: Enforces room number privacy at the database level by restricting
-- public access to sensitive profile columns (room_number, phone_number, student_id)
-- so they cannot be harvested through direct PostgREST table queries.

-- 1. Create a secure public view that omits private contact/residence details
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT
    id,
    full_name,
    degree,
    batch_year,
    branch,
    residence_type,
    hostel_name,
    created_at
  FROM public.profiles;

-- 2. Grant read access on public_profiles view to authenticated and anon users
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- 3. Restrict profiles table direct SELECT so users only read full details for their own row
-- or when explicitly querying their own profile.
-- (Note: backend API uses service_role key to safely join and redact fields programmatically)
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Notify PostgREST to immediately refresh its schema cache
NOTIFY pgrst, 'reload schema';

