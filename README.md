<div align="center">

# CampusLend

**A peer-to-peer equipment sharing platform for campus students.**

Borrow what you need. Lend what you can.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-campus--lend--peach.vercel.app-0ea5e9?style=for-the-badge&logo=vercel)](https://campus-lend-peach.vercel.app)
[![Backend](https://img.shields.io/badge/API-campus--lend.onrender.com-10b981?style=for-the-badge&logo=render)](https://campus-lend.onrender.com/health)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](LICENSE)

</div>

---

## Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Performance Optimisations](#-performance-optimisations)
- [Security Model](#-security-model)
- [Contributing](#-contributing)

---

## Overview

CampusLend solves a simple problem every hostel student faces: *you need something for a day, your neighbour has it, but there is no easy way to connect.*

The platform lets any student:
- **List** items they own and are willing to lend (calculator, racket, HDMI cable, formal wear, etc.)
- **Browse & request** items listed by fellow students on the same campus
- **Manage** incoming and outgoing borrow requests through a personal dashboard

All interactions are scoped to verified campus users, keeping the community trusted and local.

---

## Features

| Feature | Details |
|---|---|
| **Authentication** | Email/password sign-up and login via Supabase Auth |
| **Equipment Listing** | Add items with photo upload, category, and optional price note |
| **Explore & Search** | Browse all available items; filter by category; full-text search |
| **Borrow Requests** | Send, cancel, approve, or reject requests with real-time status |
| **Dashboard** | See all your borrowed requests and items you are lending in one view |
| **Profile Management** | Set room number and phone number so borrowers can find you |
| **Image Upload** | Item photos stored in Supabase Storage (max 5 MB, JPEG/PNG/WebP) |
| **Responsive UI** | Fully mobile-first design; works on all screen sizes |
| **Optimised LCP** | Hero content renders immediately — no full-page spinners blocking paint |

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI component framework |
| TypeScript | 5 | Type safety |
| Vite | 7 | Build tool and dev server |
| Tailwind CSS | 3 | Utility-first styling |
| Lucide React | latest | Icon library |
| Supabase JS | 2 | Auth and Storage client |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | JavaScript runtime |
| Express | 4 | HTTP server and routing |
| Supabase JS | 2 | Database access via service role key |
| dotenv | 16 | Environment variable loading |
| cors | 2 | Cross-origin request handling |
| nodemon | 3 | Dev auto-restart |

### Infrastructure

| Service | Role |
|---|---|
| Supabase | PostgreSQL database, Auth, and Storage |
| Vercel | Frontend hosting (auto-deploy from main) |
| Render | Backend API hosting |

---

## Project Structure

```
campus-lend/
|
+-- frontend/                        # React + Vite application
|   +-- src/
|   |   +-- components/
|   |   |   +-- LandingPage.tsx      # Full marketing landing page (unauthenticated view)
|   |   |   +-- AuthModal.tsx        # Login / Sign-up modal overlay
|   |   +-- lib/
|   |   |   +-- api.ts               # Typed fetch client for all backend endpoints
|   |   |   +-- supabase.ts          # Supabase browser client initialisation
|   |   |   +-- types.ts             # Shared TypeScript types
|   |   +-- App.tsx                  # Root component: auth gate, routing, all pages
|   |   +-- index.css                # Global styles
|   |   +-- main.tsx                 # React DOM entry point
|   +-- index.html                   # HTML shell with SEO meta and preconnect hints
|   +-- .env.example
|   +-- vite.config.ts
|   +-- package.json
|
+-- backend/                         # Node.js + Express REST API
|   +-- config/
|   |   +-- supabaseClient.js        # Initialises anonClient and serviceClient
|   +-- middleware/
|   |   +-- authMiddleware.js        # Validates Supabase JWT Bearer token
|   +-- routes/
|   |   +-- equipmentRoutes.js       # /api/equipment CRUD
|   |   +-- requestRoutes.js         # /api/requests borrow lifecycle
|   |   +-- profileRoutes.js         # /api/profiles read/update
|   +-- app.js                       # Express entry point and CORS setup
|   +-- .env.example
|   +-- package.json
|
+-- assets/
|   +-- images/
|       +-- logo.jpeg
|
+-- README.md
```

---

## Architecture

```
BROWSER (Client)
  React SPA (Vite)
  |
  +-- Supabase Auth SDK ---------> Supabase Auth (JWT tokens, sessions)
  |
  +-- Supabase Storage SDK ------> Supabase Storage (item-images bucket)
  |
  +-- REST/JSON (Bearer token) --> Express Backend API
                                      campus-lend.onrender.com
                                      |
                                      +-- authMiddleware (JWT verify)
                                      +-- /api/equipment
                                      +-- /api/requests
                                      +-- /api/profiles
                                      |
                                      +-- Supabase JS (service role)
                                            |
                                            v
                                      PostgreSQL Database
                                        - public.profiles
                                        - public.equipment
                                        - public.borrow_requests
```

**Key Design Decisions:**
- The frontend communicates with Supabase directly only for Auth and Storage. All database reads and writes go through the Express backend.
- The backend uses the Supabase service role key — it bypasses Row-Level Security (RLS) and enforces authorisation manually per-route.
- JWT verification happens in `authMiddleware.js` by calling `supabase.auth.getUser(token)` on every protected request — no secret key is ever sent to the client.

---

## Database Schema

### public.profiles
Auto-created by a database trigger (`handle_new_user`) when a user signs up via Supabase Auth.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, references auth.users(id) |
| full_name | text | Default empty string |
| room_number | text | Default empty string, required for handoffs |
| phone_number | text | Default empty string, optional contact |
| created_at | timestamptz | Auto-set |

> There is NO email column on profiles. Email lives strictly in auth.users.

### public.equipment

| Column | Type | Notes |
|---|---|---|
| equipment_id | uuid | Primary key |
| equipment_name | text | Required |
| category | text | academics, electronics, sports, event_wear |
| status | text | available or borrowed |
| owner_id | uuid | References profiles(id) |
| image_url | text | Public Supabase Storage URL |
| price_note | text | Optional free-text e.g. Rs 50/day |
| created_at | timestamptz | Auto-set |

### public.borrow_requests

| Column | Type | Notes |
|---|---|---|
| request_id | uuid | Primary key |
| equipment_id | uuid | References equipment(equipment_id) |
| borrower_id | uuid | References profiles(id) |
| owner_id | uuid | References profiles(id) |
| status | text | pending -> approved or rejected |
| created_at | timestamptz | Auto-set |

---

## API Reference

**Base URL:** `https://campus-lend.onrender.com`

Protected routes require the header:
```
Authorization: Bearer <supabase_access_token>
```

### Equipment — /api/equipment

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/equipment | Public | Returns all available items with owner info |
| GET | /api/equipment/mine | Protected | Returns all items listed by the authenticated user |
| POST | /api/equipment | Protected | Creates a new listing. owner_id is always forced to the caller |
| DELETE | /api/equipment/:equipment_id | Protected | Deletes listing if caller is the owner |

**POST /api/equipment body:**
```json
{
  "equipment_name": "Scientific Calculator",
  "category": "academics",
  "image_url": "https://...supabase.co/storage/...",
  "price_note": "Rs 10/day"
}
```

### Borrow Requests — /api/requests

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/requests/dashboard | Protected | Returns { borrowed, lending } for current user |
| POST | /api/requests | Protected | Creates a borrow request. Equipment must be available, borrower cannot be the owner |
| PUT | /api/requests/:request_id | Protected | Owner only: approve or reject. Approval marks equipment as borrowed |
| DELETE | /api/requests/:request_id | Protected | Borrower only: cancel a pending request |

**POST /api/requests body:**
```json
{
  "equipment_id": "uuid",
  "owner_id": "uuid"
}
```

**PUT /api/requests/:id body:**
```json
{
  "status": "approved"
}
```

### Profiles — /api/profiles

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/profiles/me | Protected | Fetch the authenticated user profile |
| PUT | /api/profiles/me | Protected | Update full_name, room_number, phone_number |

**PUT /api/profiles/me body (all fields optional, at least one required):**
```json
{
  "full_name": "Satyam Kumar",
  "room_number": "204-B",
  "phone_number": "+91 98765 43210"
}
```

### Health Check

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /health | Public | Returns { status: "ok", timestamp } for uptime monitoring |

---

## Getting Started

### Prerequisites

- Node.js v18 or later
- npm v9 or later
- A free Supabase project (https://supabase.com)

### Clone and Install

```bash
git clone https://github.com/satyam-0304/campus-lend.git
cd campus-lend

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Environment Variables

**backend/.env** (copy from backend/.env.example):

```env
PORT=3000
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
FRONTEND_ORIGIN=http://localhost:5173
```

> Never commit SUPABASE_SERVICE_ROLE_KEY. It has full database access.

**frontend/.env.local** (copy from frontend/.env.example):

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:3000
```

### Supabase Setup

Run the following SQL in the Supabase SQL Editor:

```sql
-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  room_number text NOT NULL DEFAULT '',
  phone_number text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Equipment
CREATE TABLE public.equipment (
  equipment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('academics','electronics','sports','event_wear')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','borrowed')),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url text,
  price_note text,
  created_at timestamptz DEFAULT now()
);

-- Borrow Requests
CREATE TABLE public.borrow_requests (
  request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipment(equipment_id) ON DELETE CASCADE,
  borrower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Create a Storage bucket named `item-images` and set it to **Public**.

### Running Locally

```bash
# Terminal 1 - backend
cd backend
npm run dev
# API at http://localhost:3000

# Terminal 2 - frontend
cd frontend
npm run dev
# App at http://localhost:5173
```

---

## Deployment

### Frontend — Vercel

1. Import the repo into Vercel (https://vercel.com)
2. Set Root Directory to `frontend`
3. Add environment variables in the Vercel dashboard:

| Variable | Value |
|---|---|
| VITE_SUPABASE_URL | Your Supabase URL |
| VITE_SUPABASE_ANON_KEY | Your Supabase anon key |
| VITE_API_URL | Your deployed backend URL |

Vercel auto-deploys on every push to `main`.

### Backend — Render

1. Create a Web Service on Render (https://render.com)
2. Set Root Directory to `backend`, Build Command to `npm install`, Start Command to `node app.js`
3. Add all environment variables from `backend/.env.example`
4. Set `FRONTEND_ORIGIN` to your Vercel URL

> **Free tier:** Render spins down after 15 min of inactivity causing a cold-start delay. Use UptimeRobot (https://uptimerobot.com) to ping /health every 14 minutes to keep the instance warm.

---

## Performance Optimisations

| Optimisation | Impact |
|---|---|
| preconnect for campus-lend.onrender.com in index.html | Eliminates DNS+TLS handshake time (~150ms) |
| Landing page shown during auth init instead of spinner | Hero h1 paints immediately |
| Removed profileLoading full-screen spinner gate | Eliminates ~2.8s blocking wait |
| Inline grid spinner; hero section never blocked | LCP element visible before data loads |
| UptimeRobot keep-alive ping on /health every 14 min | Eliminates Render cold-start (~2,500ms) |
| Dashboard Promise.all wrapped in try/catch | Graceful 503 instead of unhandled 500 |

---

## Security Model

| Concern | Approach |
|---|---|
| Authentication | Supabase Auth, tokens verified server-side on every request |
| Authorisation | Manual per-route checks in Express (owner guards, borrower guards) |
| Self-borrowing prevention | Backend rejects requests where borrower_id equals owner_id |
| Owner spoofing | owner_id on equipment creation always forced to req.user.id |
| Sensitive keys | SUPABASE_SERVICE_ROLE_KEY is backend-only, never shipped to browser |
| CORS | Allowlist-based; only origins in FRONTEND_ORIGIN are permitted |
| Image uploads | Validated client-side (type + 5MB limit) before upload |

---

## Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request against `main`

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## License

This project is licensed under the MIT License.

---

<div align="center">
Made with love for campus communities
</div>
