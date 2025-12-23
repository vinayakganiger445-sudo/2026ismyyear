# 2026 Honesty Pledge - Habit Commitment MVP

A Duolingo-style cohort-based habit commitment platform for 1000 users.

## Stack

- **Frontend**: React + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database/Auth/Realtime**: Supabase
- **Deployment**: Vercel

## Features

- Landing page with "2026 Honesty Pledge" hero
- Authentication (Supabase Auth)
- Goal setup
- Random 10-person cohort matching
- Daily 8pm check-ins
- Points and badges system

## Project Structure

```
.
├── frontend/          # React/TypeScript frontend
│   ├── src/
│   │   ├── pages/     # Page components
│   │   ├── lib/       # Utilities (Supabase client, etc.)
│   │   └── App.tsx
│   └── package.json
├── backend/           # Node/Express backend
│   ├── src/
│   │   └── index.ts
│   └── package.json
└── README.md
```

## Setup

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Add your Supabase credentials to .env
npm start
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Add your Supabase credentials to .env
npm run dev
```

## Environment Variables

### Frontend (.env)
- `REACT_APP_SUPABASE_URL` - Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Your Supabase anon/public key

### Backend (.env)
- `PORT` - Server port (default: 3001)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Development

- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:3001`

## Deployment

The project is configured for Vercel deployment. Frontend and backend can be deployed separately.

