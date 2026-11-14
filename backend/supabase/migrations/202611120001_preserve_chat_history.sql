-- Migration: 202611120001_preserve_chat_history.sql
-- Description: Ensures chat messages are preserved when equipment or requests are deleted/completed
--              (changes ON DELETE CASCADE to ON DELETE SET NULL) and ensures messages are in realtime publication.

-- 1. Modify messages.request_id foreign key constraint
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_request_id_fkey;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_request_id_fkey
  FOREIGN KEY (request_id)
  REFERENCES public.borrow_requests(request_id)
  ON DELETE SET NULL;

-- 2. Modify messages.equipment_id foreign key constraint
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_equipment_id_fkey;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_equipment_id_fkey
  FOREIGN KEY (equipment_id)
  REFERENCES public.equipment(equipment_id)
  ON DELETE SET NULL;

-- 3. Add composite index for fast conversation lookups
CREATE INDEX IF NOT EXISTS idx_messages_pair
  ON public.messages(sender_id, recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_reverse_pair
  ON public.messages(recipient_id, sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.messages(recipient_id, is_read)
  WHERE is_read = false;

-- 4. Ensure public.messages is added to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- supabase_realtime publication may not exist in pure local tests
    NULL;
END $$;

-- 5. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
