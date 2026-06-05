# Ghost LA Blendz — Setup Guide

## Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Resend account (free tier: 3,000 emails/month)

## 1. Clone & Install

```bash
cd ghost-la-blendz
npm install
```

## 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → run the contents of `supabase/schema.sql`
3. Go to **Authentication → Users** → create a new user with your admin email/password
4. Copy your project URL and anon key from **Settings → API**

## 3. Resend Setup

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Create an API key

## 4. Environment Variables

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
BARBER_EMAIL=ghost@ghostlablendz.com
FROM_EMAIL=bookings@ghostlablendz.com
ADMIN_EMAIL=admin@ghostlablendz.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## 5. Run

```bash
npm run dev
```

Visit `http://localhost:3000`

## 6. Admin Access

Go to `/admin/login` and sign in with the Supabase Auth user you created in step 2.

## 7. Deploy

```bash
npm run build
```

Deploy to Vercel — just connect the repo and add the env variables in the Vercel dashboard.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/book` | Customer booking |
| `/admin` | Admin dashboard (auth required) |
| `/admin/login` | Admin login |

## API Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/appointments` | POST | Public | Create booking |
| `/api/appointments` | GET | Admin | List bookings |
| `/api/appointments/[id]` | PATCH | Admin | Update status |
| `/api/available-slots` | GET | Public | Get available times |

## Appointment Status Flow

```
Pending → Approved → Completed
        → Declined
        → Cancelled (from Approved)
```

## Replacing Portfolio Photos

Edit `components/Portfolio.tsx` and replace the Unsplash URLs with your actual haircut photos.
Upload your photos to Supabase Storage or any CDN and update the `PHOTOS` array.
