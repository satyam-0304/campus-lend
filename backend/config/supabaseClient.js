'use strict';

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * anonClient — uses the public anon key.
 * Only purpose: supabase.auth.getUser(token) inside authMiddleware.
 * Never used for database queries.
 */
const anonClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * serviceClient — uses the secret service-role key.
 * Bypasses Row Level Security so that the backend can enforce
 * its own ownership checks in application code.
 * NEVER expose this key to the frontend.
 */
const serviceClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = { anonClient, serviceClient };
