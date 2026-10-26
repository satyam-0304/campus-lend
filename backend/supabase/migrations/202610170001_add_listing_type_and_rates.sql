-- Migration: 202610170001_add_listing_type_and_rates.sql
-- Description: Adds listing_type, sale_price, rental rate tiers, and quantity support

-- 1. Add quantity and listing configuration to equipment table
ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'rent' CHECK (listing_type IN ('sell', 'rent')),
  ADD COLUMN IF NOT EXISTS sale_price numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rate_per_day numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rate_per_month numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rate_per_semester numeric DEFAULT NULL;

-- 2. Add requested_quantity and borrow/buy metadata to borrow_requests table
ALTER TABLE public.borrow_requests
  ADD COLUMN IF NOT EXISTS requested_quantity integer NOT NULL DEFAULT 1 CHECK (requested_quantity >= 1),
  ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'rent' CHECK (request_type IN ('sell', 'rent')),
  ADD COLUMN IF NOT EXISTS rental_duration_unit text DEFAULT NULL;

-- 3. Notify PostgREST to immediately refresh its schema cache
NOTIFY pgrst, 'reload schema';
