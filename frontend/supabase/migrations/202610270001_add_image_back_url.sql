-- Migration: 202610270001_add_image_back_url.sql
-- Description: Adds image_back_url column to equipment for mandatory front+back photo uploads

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS image_back_url text DEFAULT NULL;

-- Notify PostgREST to immediately refresh its schema cache
NOTIFY pgrst, 'reload schema';
