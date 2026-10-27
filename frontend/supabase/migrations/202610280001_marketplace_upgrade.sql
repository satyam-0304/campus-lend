-- Migration: 202610280001_marketplace_upgrade.sql
-- Description: Adds marketplace rental/purchase fields, lifecycle statuses, reviews, realtime messages, notifications, and email OTP verification

-- 1. Extend borrow_requests table with marketplace rental & purchase metadata
ALTER TABLE public.borrow_requests
  ADD COLUMN IF NOT EXISTS rental_start_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rental_end_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS buyer_note text DEFAULT NULL;

-- 2. Expand status constraint on borrow_requests to support full marketplace lifecycle
ALTER TABLE public.borrow_requests
  DROP CONSTRAINT IF EXISTS borrow_requests_status_check;

ALTER TABLE public.borrow_requests
  ADD CONSTRAINT borrow_requests_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'active', 'returned', 'completed'));

-- 3. Create reviews table for campus trust and ratings
CREATE TABLE IF NOT EXISTS public.reviews (
  review_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   uuid NOT NULL REFERENCES public.borrow_requests(request_id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES public.equipment(equipment_id) ON DELETE CASCADE,
  reviewer_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating       integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment      text DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_review_per_request UNIQUE (request_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_equipment ON public.reviews(equipment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);

-- 4. Create messages table for In-App Realtime Chat
CREATE TABLE IF NOT EXISTS public.messages (
  message_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   uuid REFERENCES public.borrow_requests(request_id) ON DELETE CASCADE,
  equipment_id uuid REFERENCES public.equipment(equipment_id) ON DELETE CASCADE,
  sender_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      text NOT NULL,
  is_read      boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_request ON public.messages(request_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages(sender_id, recipient_id);

-- 5. Create notifications table for in-app alert center
CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           text NOT NULL,
  message         text NOT NULL,
  type            text NOT NULL DEFAULT 'info',
  link            text DEFAULT NULL,
  is_read         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- 6. Create email_verifications table for PEC email PIN verification
CREATE TABLE IF NOT EXISTS public.email_verifications (
  email        text PRIMARY KEY,
  otp_code     varchar(6) NOT NULL,
  expires_at   timestamptz NOT NULL,
  verified     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 7. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- 8. Add RLS Policies
-- Reviews: anyone authenticated can read; participants can insert
DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_participant" ON public.reviews;
CREATE POLICY "reviews_insert_participant" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- Messages: participants only
DROP POLICY IF EXISTS "messages_select_involved" ON public.messages;
CREATE POLICY "messages_select_involved" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
CREATE POLICY "messages_insert_sender" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Notifications: owner only
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
