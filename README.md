# DevSync

> **"Different Skills. Same Goals. Stronger Teams."**

DevSync is a networking and team-formation platform for university students to discover hackathon teammates with complementary skills, shared ambitions, and aligned roles.

---

## Architecture

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, React Router v6 in `client/`
- **Backend**: Node.js, Express, Mongoose in `server/`
- **Database**: MongoDB (Atlas in production, local/in-memory for development)
- **Deployment**: Single Vercel project with serverless Express routing via `api/index.js`

---

## Core Features

- **Explainable Complementarity Matching**: Matches candidates against specific missing team skills, role alignments, and shared passion domains with transparent reasoning.
- **University Student Profiles**: Skill taxonomy normalization, proficiency badges, portfolio links, and completion tracker.
- **Hackathon Discovery**: Real-time registration and team-formation countdowns, skill filters, and role caps.
- **Centralized Requests Hub**: Unified tracking for connection requests, team invites, and hackathon join applications.
- **Host Command Center**: Create hackathons, review registrations, publish broadcast announcements, and export participant rosters to CSV.
- **Production Hardening**: Strict Zod validation schemas, Mongo operator sanitization, rate limiting with MongoDB TTL collections, and serverless Mongoose connection pooling.

---

## Quickstart

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` in `server/` to `server/.env`:
```bash
cp server/.env.example server/.env
```

### 3. Run Development Servers
```bash
npm run dev
```
- Client runs on `http://localhost:5173`
- Server runs on `http://localhost:5000`

### 4. Run Automated Tests
```bash
npm run test:server
```

### 5. Build for Production
```bash
npm run build
```

---

## Documentation

- `CONTRACT.md`: Complete API contracts, validation rules, matching weights, and response schemas.
- `DEPLOY.md`: Production deployment guide for Vercel + MongoDB Atlas.
