# CampusLend — Project Instruction Document

> **Purpose**: This is the canonical reference for the CampusLend codebase. Every feature, bug-fix, or refactor **must** follow the constraints, conventions, and architecture described here. Violating any rule marked **CRITICAL** is a breaking change.

---

## 1. What is CampusLend?

An on-campus **peer-to-peer equipment lending** platform where college students list items they own (calculators, rackets, adapters, ethnic wear, etc.) and other students request to borrow them. The owner approves or rejects each request. Once approved, the item's status flips to `borrowed`.

**Tagline**: *"Borrow what you need. Lend what you can."*

---

## 2. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Supabase Cloud                          │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  auth.users   │  │  public.profiles │  │  public.equipment│  │
│  │  (email/pass) │  │  (trigger-sync)  │  │                  │  │
│  └──────┬───────┘  └────────┬────────┘  └────────┬─────────┘  │
│         │ on_auth_user_created          public.borrow_requests │
│         └──────────────────────────────────────────────────────┘
│                                                                │
└────────────────────────────────────────────────────────────────┘
       ▲ JWT verify (anonClient)     ▲ CRUD (serviceClient)
       │                              │
┌──────┴──────────────────────────────┴──────────────────────────┐
│                 Express Backend (port 3000)                     │
│   app.js ─► equipmentRoutes ─► requestRoutes ─► profileRoutes  │
│   middleware/authMiddleware.js  (Bearer token → req.user)       │
│   config/supabaseClient.js     (anonClient + serviceClient)    │
└──────────────────────────┬─────────────────────────────────────┘
                           │  REST JSON over HTTP
                           ▼
┌────────────────────────────────────────────────────────────────┐
│            React + Vite Frontend (port 5173)                    │
│   src/App.tsx          — monolithic UI (all pages/components)   │
│   src/lib/api.ts       — fetch wrapper with auth headers        │
│   src/lib/supabase.ts  — Supabase client (auth only)            │
│   src/lib/types.ts     — shared TypeScript types                │
│   Tailwind CSS v3 + Inter font                                  │
└────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **Backend uses `serviceClient`** (service-role key) for all DB queries | Bypasses RLS so ownership checks are enforced in application code. The frontend never directly queries the DB. |
| **Backend uses `anonClient`** only for `auth.getUser(token)` | Token verification against Supabase Auth without needing the service-role key's auth powers. |
| **Frontend talks to Supabase only for auth** (sign-up, sign-in, session management) | All data read/writes go through the Express API. The frontend Supabase client is **not** used for DB queries. |
| **Monolithic `App.tsx`** | All UI components live in a single ~690-line file. There is no router — page state is managed with a `useState<Page>`. |
| **No file/image upload logic** | `image_url` accepts a plain URL string or null. Supabase Storage is out of scope. |

---

## 3. Directory Structure

```
campus-lend-1/
├── backend/
│   ├── config/
│   │   └── supabaseClient.js      # anonClient + serviceClient init
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT Bearer validation → req.user
│   ├── routes/
│   │   ├── equipmentRoutes.js      # GET /, POST /, DELETE /:id
│   │   ├── requestRoutes.js        # GET /dashboard, POST /, PUT /:id
│   │   └── profileRoutes.js        # GET /me, PUT /me
│   ├── app.js                      # Express entry point, CORS, middleware, routes
│   ├── .env                        # PORT, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── assets/images/logo.jpeg
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.ts              # Typed fetch client (getAuthHeader + handleResponse)
│   │   │   ├── supabase.ts         # Supabase browser client (auth only)
│   │   │   └── types.ts            # Profile, EquipmentRow, BorrowRequestRow, etc.
│   │   ├── App.tsx                 # THE monolith — all pages & components
│   │   ├── main.tsx                # React 18 createRoot entry
│   │   └── index.css               # Tailwind directives + Inter font + reset
│   ├── supabase/
│   │   └── migrations/
│   │       └── 20260827163756_create_campuslend_schema.sql
│   ├── index.html
│   ├── vite.config.ts              # @ alias → ./src, excludes lucide-react from optimizeDeps
│   ├── tailwind.config.js          # content: index.html + src/**
│   ├── postcss.config.js
│   ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
│   ├── eslint.config.js
│   ├── .env                        # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
│   └── .env.example
│
├── backend-architecture.md         # Original planning document
└── testv0.md                       # Manual QA test plan for v0
```

---

## 4. Database Schema (Source of Truth)

The single migration file is: `frontend/supabase/migrations/20260827163756_create_campuslend_schema.sql`

### `public.profiles`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE | 1:1 with auth user |
| `full_name` | `text` | NOT NULL, DEFAULT `''` | |
| `room_number` | `text` | NOT NULL, DEFAULT `''` | |
| `phone_number` | `text` | NOT NULL, DEFAULT `''` | |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

> [!CAUTION]
> **There is NO `email` column in `profiles`.** Email lives exclusively in `auth.users`. Never query, insert, update, or select `email` on `public.profiles`. This has caused `SQLSTATE 42703` errors in the past.

**Auto-creation trigger**: When a user signs up via `auth.users`, the `handle_new_user()` trigger fires and inserts a row into `profiles` using `raw_user_meta_data` for `full_name`, `room_number`, and `phone_number`.

### `public.equipment`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `equipment_id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `equipment_name` | `text` | NOT NULL | |
| `category` | `text` | NOT NULL, CHECK IN (`academics`, `electronics`, `sports`, `event_wear`) | |
| `status` | `text` | NOT NULL, DEFAULT `'available'`, CHECK IN (`available`, `borrowed`) | |
| `owner_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | |
| `image_url` | `text` | nullable | Plain URL string, no upload |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

### `public.borrow_requests`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `request_id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `equipment_id` | `uuid` | NOT NULL, FK → `equipment(equipment_id)` ON DELETE CASCADE | |
| `borrower_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | |
| `owner_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | Denormalized for easy filtering |
| `status` | `text` | NOT NULL, DEFAULT `'pending'`, CHECK IN (`pending`, `approved`, `rejected`) | |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

### Indexes

- `idx_equipment_owner` on `equipment(owner_id)`
- `idx_equipment_category` on `equipment(category)`
- `idx_borrow_requests_borrower` on `borrow_requests(borrower_id)`
- `idx_borrow_requests_owner` on `borrow_requests(owner_id)`
- `idx_borrow_requests_equipment` on `borrow_requests(equipment_id)`

### Row Level Security (RLS)

RLS is **enabled** on all three tables with policies scoped to `authenticated`:

| Table | Operation | Policy |
|---|---|---|
| `profiles` | SELECT | Any authenticated user can read any profile |
| `profiles` | UPDATE | Only own row (`auth.uid() = id`) |
| `equipment` | SELECT | Any authenticated user |
| `equipment` | INSERT | Own items only (`auth.uid() = owner_id`) |
| `equipment` | UPDATE | Own items only |
| `equipment` | DELETE | Own items only |
| `borrow_requests` | SELECT | Involved party (`borrower_id` or `owner_id` = `auth.uid()`) |
| `borrow_requests` | INSERT | Only as borrower (`auth.uid() = borrower_id`) |
| `borrow_requests` | UPDATE | Only as owner (`auth.uid() = owner_id`) |

> [!IMPORTANT]
> The backend uses `serviceClient` (service-role key) which **bypasses RLS entirely**. All authorization checks are enforced in route handler code (e.g., comparing `req.user.id` to `owner_id`). RLS policies exist as a safety net and for any future direct-client access.

---

## 5. Backend API Reference

**Base URL**: `http://localhost:3000` (dev) / configurable via `PORT` env var

### Authentication Flow

```
Frontend → Supabase Auth (sign-up / sign-in) → gets JWT access_token
Frontend → Express API with header: Authorization: Bearer <token>
Express  → authMiddleware → anonClient.auth.getUser(token) → req.user
Express  → route handler → serviceClient DB query
```

`req.user` is the full Supabase Auth user object. Key fields used: `req.user.id`, `req.user.email`.

### Equipment API (`/api/equipment`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Public | Returns all equipment with `status = 'available'`, joined with owner profile. Ordered by `created_at DESC`. |
| `POST` | `/` | Protected | Creates equipment. `owner_id` is **always forced** to `req.user.id` (body value ignored). Validates `equipment_name` (non-empty string) and `category` (must be valid enum). |
| `DELETE` | `/:equipment_id` | Protected | Deletes equipment. Verifies `owner_id === req.user.id` before deletion. Returns 204. |

**Select string** (join pattern):
```
equipment_id, equipment_name, category, status, owner_id, image_url, created_at,
owner:profiles!owner_id(id, full_name, room_number, phone_number)
```

### Request API (`/api/requests`)

All routes are **protected** (router-level `authMiddleware`).

| Method | Path | Description |
|---|---|---|
| `GET` | `/dashboard` | Returns `{ borrowed: [...], lending: [...] }` for the current user. Must be defined before `/:request_id` to avoid route conflict. |
| `POST` | `/` | Creates a borrow request. `borrower_id` is forced to `req.user.id`. Validates: `equipment_id` + `owner_id` required, self-borrow blocked, equipment must be `available`. |
| `PUT` | `/:request_id` | Updates request status to `approved` or `rejected`. Owner-only. On approval, also sets `equipment.status → 'borrowed'`. |

**Select string** (triple join):
```
request_id, equipment_id, borrower_id, owner_id, status, created_at,
equipment:equipment_id(equipment_name),
borrower:profiles!borrower_id(id, full_name, room_number, phone_number),
owner:profiles!owner_id(id, full_name, room_number, phone_number)
```

### Profile API (`/api/profiles`)

All routes are **protected** (router-level `authMiddleware`).

| Method | Path | Description |
|---|---|---|
| `GET` | `/me` | Fetches the authenticated user's profile row. |
| `PUT` | `/me` | Partial update — only updates fields explicitly sent in the body (`full_name`, `room_number`, `phone_number`). At least one field required. |

**Select string**: `id, full_name, room_number, phone_number` (never includes `email`).

> [!NOTE]
> There is **no POST** route for profiles. The Supabase `handle_new_user` trigger auto-creates profile rows on sign-up.

### Health & Error Routes

- `GET /health` → `{ status: 'ok', timestamp: '...' }`
- Any unmatched route → `404 { error: 'Route not found' }`
- Uncaught errors → `500 { error: 'Internal server error' }`

---

## 6. Frontend Architecture

### Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18.3.x |
| Build tool | Vite | 5.4.x |
| Language | TypeScript | 5.5.x |
| Styling | Tailwind CSS | 3.4.x |
| Icons | lucide-react | 0.446.x |
| Auth client | @supabase/supabase-js | 2.57.x |
| Font | Inter (Google Fonts) | 400–800 weights |

### Path Alias

`@` is aliased to `./src` in `vite.config.ts`. All imports use `@/lib/...` style.

### App Flow & Routing

There is **no router library** (no react-router). Navigation is a `useState<Page>` where `Page = 'explore' | 'add' | 'dashboard' | 'profile'`.

```
App loads
  → Check session (supabase.auth.getSession)
  → No session? → AuthScreen (login / signup)
  → Session but no profile? → ProfileSetup (room, phone)
  → Session + profile? → Main app (Navbar + page content)
```

### Component Map (all in `App.tsx`)

| Component | Purpose | Lines |
|---|---|---|
| `App` | Root — session/profile state, auth listener, toast, page routing | 44–139 |
| `AuthScreen` | Login/signup form with toggle tabs | 143–223 |
| `ProfileSetup` | First-time profile completion (name, room, phone) | 225–265 |
| `Navbar` | Top nav with desktop/mobile, user menu, logo | 269–317 |
| `Explore` | Browse available equipment, search/filter, request to borrow | 321–410 |
| `ItemCard` | Individual equipment card in the grid | 412–439 |
| `AddItem` | Form to list a new item | 443–499 |
| `Dashboard` | Split view — outgoing requests + incoming requests with approve/decline | 503–576 |
| `RequestSection` | Reusable request list card | 578–602 |
| `ProfilePage` | Edit profile (name, room, phone) | 606–653 |
| `StatusBadge` | Colored pill for pending/approved/rejected | 657–659 |
| `Empty` | Empty-state placeholder with icon | 661–669 |
| `Field` | Reusable form input with label | 671–678 |
| `CenteredSpinner` | Loading spinner | 680–682 |
| `getInitials` | Utility to extract initials from name | 684–688 |

### API Client (`src/lib/api.ts`)

- `getAuthHeader()` — gets current session token from Supabase and returns `{ Authorization: 'Bearer ...', 'Content-Type': 'application/json' }`.
- `handleResponse<T>()` — error handling + JSON parsing.
- `api` object with methods: `getEquipment`, `createEquipment`, `deleteEquipment`, `getDashboard`, `createRequest`, `updateRequestStatus`, `getMyProfile`, `updateMyProfile`.

### Type Definitions (`src/lib/types.ts`)

```typescript
Category = 'academics' | 'electronics' | 'sports' | 'event_wear'
EquipmentStatus = 'available' | 'borrowed'
RequestStatus = 'pending' | 'approved' | 'rejected'
Profile = { id, full_name, room_number, phone_number }
EquipmentRow = { equipment_id, equipment_name, category, status, owner_id, image_url, created_at }
EquipmentWithOwner = EquipmentRow & { owner: Profile }
BorrowRequestRow = { request_id, equipment_id, borrower_id, owner_id, status, created_at }
BorrowRequestWithDetails = BorrowRequestRow & { equipment: { equipment_name }, borrower: Profile, owner: Profile }
```

---

## 7. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default: 3000) | Express server port |
| `SUPABASE_URL` | **Yes** | Supabase project URL |
| `SUPABASE_ANON_KEY` | **Yes** | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase service-role key (secret, bypasses RLS) |
| `FRONTEND_ORIGIN` | No | For CORS (currently unused — `cors()` is open) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | **Yes** | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Supabase anon/public key |
| `VITE_API_URL` | No (default: `http://localhost:3000`) | Backend API base URL |

---

## 8. Critical Rules — DO NOT VIOLATE

> [!CAUTION]
> Breaking any of these rules will cause runtime errors, data corruption, or security holes.

1. **No `email` on `profiles`**: The `profiles` table has NO `email` column. Never add it to queries, selects, inserts, or updates. Email is in `auth.users` only.

2. **`owner_id` is server-enforced**: On `POST /api/equipment`, `owner_id` is **always** set to `req.user.id`. Never trust the request body for ownership.

3. **`borrower_id` is server-enforced**: On `POST /api/requests`, `borrower_id` is **always** set to `req.user.id`. Never trust the request body.

4. **Authorization is application-level**: The backend uses `serviceClient` which bypasses RLS. All permission checks (`owner_id === req.user.id`, self-borrow prevention, etc.) **must** be done in route handler code.

5. **No direct DB access from frontend**: The frontend Supabase client is used **only** for authentication (`signUp`, `signInWithPassword`, `getSession`, `signOut`). All data operations go through the Express API.

6. **`/dashboard` route must be defined before `/:request_id`**: Express matches routes in order. If `/:request_id` comes first, it captures "dashboard" as a request_id param.

7. **Profile auto-creation via trigger**: There is no `POST /api/profiles` endpoint. Profiles are created by the `handle_new_user` database trigger when a user signs up.

8. **Category values are a closed set**: `academics`, `electronics`, `sports`, `event_wear`. Adding a new category requires: updating the DB CHECK constraint, backend `VALID_CATEGORIES` array, frontend `Category` type, `categoryLabels` map, and the category select/filter UI.

9. **Status values are closed sets**: Equipment: `available`, `borrowed`. Requests: `pending`, `approved`, `rejected`. Adding a new status requires DB CHECK constraint changes.

---

## 9. Development Workflow

### Starting the Dev Environment

```bash
# Terminal 1 — Backend
cd backend
npm run dev          # uses nodemon, watches for changes

# Terminal 2 — Frontend
cd frontend
npm run dev          # Vite dev server on port 5173
```

### Adding a New Backend Route

1. Create or modify a file in `backend/routes/`.
2. Use `const { serviceClient } = require('../config/supabaseClient');` for DB operations.
3. Use `const authMiddleware = require('../middleware/authMiddleware');` for protected routes.
4. Always force `req.user.id` for any user-identity field (owner_id, borrower_id, etc.).
5. Mount in `app.js` via `app.use('/api/<resource>', routeModule);`.
6. Add corresponding method to `frontend/src/lib/api.ts`.
7. Add types to `frontend/src/lib/types.ts` if new shapes are returned.

### Adding a New Frontend Page

1. Add the page name to the `Page` union type in `App.tsx`.
2. Create the component function in `App.tsx` (or refactor into a separate file if splitting).
3. Add a conditional render in the `main` element of the `App` component.
4. Add a nav link in the `Navbar` component's `links` array.

### Modifying the Database Schema

1. Create a new migration file in `frontend/supabase/migrations/` with timestamp prefix.
2. Update this instruction document's schema section.
3. Update `frontend/src/lib/types.ts`.
4. Update backend route select strings and validation logic.
5. Update frontend API client and components.

---

## 10. Design System & UI Conventions

| Property | Value |
|---|---|
| **Font** | Inter (Google Fonts: 400, 500, 600, 700, 800) |
| **Primary color** | Sky-600 (`#0284c7`) |
| **Background** | Slate-50 (`#f8fafc`) |
| **Text** | Slate-900 (`#0f172a`) |
| **Card style** | `rounded-3xl border border-slate-200 bg-white p-6 shadow-sm` |
| **Button primary** | `rounded-xl bg-sky-600 text-white font-extrabold shadow-lg shadow-sky-600/20` |
| **Button hover** | `hover:bg-sky-700` |
| **Input style** | `rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium` focus: `border-sky-500 ring-4 ring-sky-500/10` |
| **Status badges** | Rounded-full pills: emerald (approved), amber (pending), rose (rejected) |
| **Toast** | Fixed bottom-center, dark bg, emerald checkmark icon, auto-dismiss 2.8s |
| **Grid** | `sm:grid-cols-2 lg:grid-cols-3` for equipment cards |
| **Nav height** | `h-18` (custom: 4.5rem) |

---

## 11. Deployment Notes

| Component | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Served from `dist/` after `npm run build` |
| Backend | Render / Railway / etc. | Node.js service running `npm start` |
| Database | Supabase | Hosted PostgreSQL with Auth |

- CORS on the backend is currently **wide open** (`app.use(cors())`). For production, restrict to the Vercel domain.
- The `FRONTEND_ORIGIN` env var exists in `.env.example` but is not yet wired into the CORS config.
- OG images in `index.html` still reference `bolt.new` placeholder URLs — should be replaced for production.

---

## 12. Known Technical Debt & Gaps

| Item | Severity | Notes |
|---|---|---|
| **Monolithic `App.tsx`** (~690 lines) | Medium | All components in one file. Should be split when adding significant features. |
| **No client-side routing** | Medium | URL doesn't change between pages; no deep linking, no browser back/forward. |
| **CORS wide open** | High (prod) | `cors()` allows all origins. Must restrict for production. |
| **No image upload** | Low | `image_url` exists but no upload mechanism. Storage integration needed. |
| **No "return" flow** | Medium | Once an item is approved/borrowed, there's no way to mark it as returned. `equipment.status` stays `borrowed` forever. |
| **No duplicate request prevention** | Low | A user can send multiple pending requests for the same item. |
| **No pagination** | Low | Equipment and dashboard queries return all rows. |
| **No real-time updates** | Low | Dashboard/explore don't auto-refresh when another user acts. |
| **Placeholder OG images** | Low | `index.html` has `bolt.new` og:image URLs. |
| **Bell icon is decorative** | Low | Notifications button in navbar has no functionality. |

---

## 13. Checklist for Any Change

Before submitting any change, verify:

- [ ] No `email` column referenced on `profiles` table
- [ ] User-identity fields are server-enforced (`req.user.id`)
- [ ] New routes follow the existing pattern: validation → auth check → DB operation → response
- [ ] TypeScript types in `types.ts` match the API response shapes
- [ ] API methods in `api.ts` correctly call `getAuthHeader()` for protected endpoints
- [ ] New DB columns/tables have migration files and CHECK constraints where applicable
- [ ] UI follows the existing design system (sky-600 primary, rounded-xl/3xl, Inter font, etc.)
- [ ] Environment variables are documented in `.env.example` files
