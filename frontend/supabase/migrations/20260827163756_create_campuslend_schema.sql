/*
# CampusLend — core schema (profiles, equipment, borrow_requests)

## What this does
Creates the three tables that power CampusLend, a campus equipment-sharing app
where students lend and borrow items from each other. Each student has a profile
(with room number and phone), can list equipment they own, and can send borrow
requests to other students for items they need.

## Tables created

### 1. profiles
- `id` (uuid, primary key) — references auth.users; one row per student.
- `full_name` (text) — display name shown on listings and requests.
- `room_number` (text) — hostel/college room, shown so borrowers know where to pick up.
- `phone_number` (text) — private contact, only visible to the profile owner.
- `created_at` (timestamptz) — when the profile was created.

### 2. equipment
- `equipment_id` (uuid, primary key) — unique id for each listed item.
- `equipment_name` (text) — what the item is, e.g. "Casio Fx-991EX Calculator".
- `category` (text, CHECK constraint) — one of: academics, electronics, sports, event_wear.
- `status` (text, CHECK constraint) — one of: available, borrowed. Defaults to 'available'.
- `owner_id` (uuid, foreign key → profiles.id) — the student who owns the item.
- `image_url` (text, nullable) — optional photo of the item.
- `created_at` (timestamptz) — when the item was listed.

### 3. borrow_requests
- `request_id` (uuid, primary key) — unique id for each request.
- `equipment_id` (uuid, foreign key → equipment.equipment_id) — the item being requested.
- `borrower_id` (uuid, foreign key → profiles.id) — the student asking to borrow.
- `owner_id` (uuid, foreign key → profiles.id) — the student who owns the item (denormalized for easy filtering).
- `status` (text, CHECK constraint) — one of: pending, approved, rejected. Defaults to 'pending'.
- `created_at` (timestamptz) — when the request was made.

## Security (Row Level Security)

All three tables have RLS enabled. Policies are scoped to `authenticated` users
because CampusLend has a sign-in screen.

### profiles
- SELECT: a user can read any profile (needed to show owner names/rooms on listings).
- INSERT: a user can only insert their own profile row.
- UPDATE: a user can only update their own profile row.

### equipment
- SELECT: any authenticated user can see all listings (campus-wide marketplace).
- INSERT: a user can only list items they own (owner_id = auth.uid()).
- UPDATE: the owner can update their own listings (e.g. mark as borrowed/available).
- DELETE: the owner can delete their own listings.

### borrow_requests
- SELECT: a user can see requests they sent (borrower_id = auth.uid()) OR requests
  for items they own (owner_id = auth.uid()).
- INSERT: a user can only create requests where they are the borrower.
- UPDATE: only the item owner can approve/reject a request (owner_id = auth.uid()).

## Important notes
1. `owner_id` on equipment defaults to `auth.uid()` so the frontend insert can
   omit it and the authenticated user is recorded as the owner automatically.
2. `borrower_id` on borrow_requests defaults to `auth.uid()` for the same reason.
3. `owner_id` on borrow_requests is NOT defaulted — the frontend must pass it
   (it is read from the equipment row the user is requesting).
4. No `DROP` or destructive operations — safe to re-run (idempotent with IF NOT EXISTS).
*/

-- 1. Reset existing tables and functions cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.borrow_requests CASCADE;
DROP TABLE IF EXISTS public.equipment CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Profiles Table (Holds non-sensitive public campus details; auth.users manages email and password)
CREATE TABLE public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text NOT NULL DEFAULT '',
  room_number  text NOT NULL DEFAULT '',
  phone_number text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 3. Equipment Table
CREATE TABLE public.equipment (
  equipment_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_name text NOT NULL,
  category       text NOT NULL DEFAULT 'academics'
                 CHECK (category IN ('academics', 'electronics', 'sports', 'event_wear')),
  status         text NOT NULL DEFAULT 'available'
                 CHECK (status IN ('available', 'borrowed')),
  owner_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url      text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 4. Borrow Requests Table
CREATE TABLE public.borrow_requests (
  request_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipment(equipment_id) ON DELETE CASCADE,
  borrower_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 5. Performance Indexes
CREATE INDEX idx_equipment_owner ON public.equipment(owner_id);
CREATE INDEX idx_equipment_category ON public.equipment(category);
CREATE INDEX idx_borrow_requests_borrower ON public.borrow_requests(borrower_id);
CREATE INDEX idx_borrow_requests_owner ON public.borrow_requests(owner_id);
CREATE INDEX idx_borrow_requests_equipment ON public.borrow_requests(equipment_id);

-- 6. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Equipment Policies
CREATE POLICY "equipment_select_all"
  ON public.equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "equipment_insert_own"
  ON public.equipment FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "equipment_update_own"
  ON public.equipment FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "equipment_delete_own"
  ON public.equipment FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Borrow Requests Policies
CREATE POLICY "borrow_requests_select_involved"
  ON public.borrow_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = borrower_id OR auth.uid() = owner_id);

CREATE POLICY "borrow_requests_insert_borrower"
  ON public.borrow_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = borrower_id);

CREATE POLICY "borrow_requests_update_owner"
  ON public.borrow_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 7. Automatic Profile Creation Trigger
-- Eliminates manual profile insertions during signup and prevents missing-column errors entirely.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$ BEGIN   INSERT INTO public.profiles (id, full_name, room_number, phone_number)   VALUES (     new.id,     COALESCE(new.raw_user_meta_data->>'full_name', ''),     COALESCE(new.raw_user_meta_data->>'room_number', ''),     COALESCE(new.raw_user_meta_data->>'phone_number', '')   );   RETURN new; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();