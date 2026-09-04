# CampusLend — Backend Architecture & Planning Document

## 1. System Overview
CampusLend is an on-campus peer-to-peer equipment lending platform.
- **Frontend**: React (Vite, TypeScript, Tailwind CSS) running on `http://localhost:5173`.
- **Backend API**: Node.js & Express running on `http://localhost:3000`.
- **Database & Auth**: Supabase PostgreSQL and Supabase Auth.
- **Client Library**: `@supabase/supabase-js`.

---

## 2. Database Schema (Source of Truth)

### `public.profiles`
Managed automatically via database trigger upon user signup.
* `id` (uuid, primary key, references `auth.users(id)`)
* `full_name` (text, default: '')
* `room_number` (text, default: '')
* `phone_number` (text, default: '')
* `created_at` (timestamptz)
* **CRITICAL RULE**: There is NO `email` column in `profiles`. Authentication credentials stay strictly inside `auth.users`. Never query, update, or insert `email` on `public.profiles`.

### `public.equipment`
* `equipment_id` (uuid, primary key)
* `equipment_name` (text)
* `category` (text: 'academics', 'electronics', 'sports', 'event_wear')
* `status` (text: 'available', 'borrowed')
* `owner_id` (uuid, references `profiles(id)`)
* `image_url` (text, nullable)
* `created_at` (timestamptz)

### `public.borrow_requests`
* `request_id` (uuid, primary key)
* `equipment_id` (uuid, references `equipment(equipment_id)`)
* `borrower_id` (uuid, references `profiles(id)`)
* `owner_id` (uuid, references `profiles(id)`)
* `status` (text: 'pending', 'approved', 'rejected')
* `created_at` (timestamptz)

---

## 3. Backend Structure

```text
backend/
├── config/
│   └── supabaseClient.js    # Supabase admin/anon client initialization
├── middleware/
│   └── authMiddleware.js    # Validates Supabase JWT Bearer token
├── routes/
│   ├── equipmentRoutes.js   # Equipment CRUD endpoints
│   ├── requestRoutes.js     # Borrow request workflows and dashboard
│   └── profileRoutes.js     # User profile retrieval and updates
├── .env                     # PORT, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
├── app.js                   # Express server entry point & CORS configuration
└── package.json

4. API Endpoints Specification
Authentication Middleware (authMiddleware.js)
Reads header: Authorization: Bearer <token>.

Verifies token via supabase.auth.getUser(token).

Injects verified user into request context: req.user = user.

Returns 401 Unauthorized if token is missing or invalid.

Equipment API (/api/equipment)
GET /: Public. Returns all equipment with status = 'available'.

POST /: Protected. Adds an item. Forces owner_id = req.user.id.

DELETE /:equipment_id: Protected. Deletes item only if owner_id = req.user.id.

Request API (/api/requests)
POST /: Protected. Creates a borrow request. Validates that borrower_id = req.user.id and borrower is not the owner. Sets initial status to 'pending'.

PUT /:request_id: Protected. Updates status to 'approved' or 'rejected'. Only allowed if owner_id = req.user.id. If approved, updates the related item's status to 'borrowed'.

GET /dashboard: Protected. Returns:

borrowed: Requests where borrower_id = req.user.id.

lending: Requests where owner_id = req.user.id.

Profile API (/api/profiles)
GET /me: Protected. Fetches the current user's profile details.

PUT /me: Protected. Updates full_name, room_number, and phone_number where id = req.user.id.

5. Development Roadmap & Milestones
Milestone 1: Database Initialization

Execute clean SQL setup script in the Supabase SQL Editor.

Verify handle_new_user trigger is created and enabled.

Milestone 2: Backend Core Build

Set up backend/config/supabaseClient.js.

Implement authMiddleware.js.

Implement and mount all route handlers in backend/app.js.

Milestone 3: Route Testing

Verify public equipment endpoint returns an empty array [] on fresh DB.

Test JWT extraction and route protection using dummy or real tokens.

Milestone 4: Full Integration

Run frontend on port 5173 and backend on port 3000.

Verify user signup triggers automatic profile creation without throwing SQLSTATE 42703.