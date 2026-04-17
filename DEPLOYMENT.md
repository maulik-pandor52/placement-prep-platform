# PrepEasy Deployment Guide

## Project Structure

- `frontend/`: React + Vite + Tailwind UI
- `backend/`: Node.js + Express API
- `MongoDB`: recommended via MongoDB Atlas for production

## Environment Setup

### Frontend

Copy `frontend/.env.example` to `frontend/.env` and set:

```env
VITE_API_BASE_URL=https://your-backend-domain/api
```

### Backend

Copy `backend/.env.example` to `backend/.env` and set:

```env
PORT=5000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-long-random-secret
ALLOWED_ORIGINS=https://your-frontend-domain
ADMIN_EMAILS=admin@example.com
ADMIN_INVITE_CODE=your-admin-invite-code
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
ADZUNA_COUNTRY=in
```

## Local Run

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Production Hosting

### Frontend

- Recommended: Vercel or Netlify
- Set root directory to `frontend`
- Add environment variable:
  - `VITE_API_BASE_URL`
- `frontend/vercel.json` already includes SPA route rewrites

### Backend

- Recommended: Render or Railway
- Set root directory to `backend`
- Build command: `npm install`
- Start command: `npm start`
- `render.yaml` is included as a starter Render config

### Database

- Recommended: MongoDB Atlas
- Add the Atlas connection string to `MONGO_URI`

## Production Checklist

- Rotate all current development secrets before going live
- Set a strong `JWT_SECRET`
- Replace local MongoDB with MongoDB Atlas
- Set `ALLOWED_ORIGINS` to the real frontend URL
- Add your real admin emails and invite code
- Verify `/api/health` on the deployed backend
- Verify student and admin login flows
- Verify uploads work if mock interview video storage is required in production

## Notes

- The frontend now uses a shared API service layer instead of hardcoded localhost URLs
- The backend exposes `GET /api/health` and `GET /api/auth/profile`
- Current build is deployment-ready, but actual live deployment still requires your hosting accounts and environment values
