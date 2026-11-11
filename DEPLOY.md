# Deploying DevSync to Vercel + MongoDB Atlas

DevSync is deployed as **one integrated Vercel project**:
- React 18 frontend built via Vite (`client/dist`)
- Express REST API executed as a serverless function (`api/index.js`)
- Single unified domain with no CORS mismatch issues

`vercel.json` at the repository root orchestrates this setup:
- `installCommand`: `npm run install:all`
- `buildCommand`: `npm run build`
- `outputDirectory`: `client/dist`
- `/api/*` rewrites to `/api/index.js`; all other paths route to `client/dist/index.html`.

---

## Technical Decisions & Security Architecture

### 1. Serverless Database Connection Reuse
In `server/src/dbConnect.js`, the active Mongoose connection is cached on `globalThis._mongooseConnection`. This prevents exhausting connection limits across rapid serverless lambdas while keeping cold starts minimal. In production (`NODE_ENV === 'production'`), fallback to in-memory MongoDB is strictly rejected.

### 2. Distributed Rate Limiting via MongoDB TTL Store
In-memory rate limit stores fail on serverless platforms because invocations execute on ephemeral instances. DevSync implements `MongoStore` in `server/src/utils/rateLimiter.js` using a native MongoDB TTL collection (`RateLimitRecord`). Expired windows are pruned automatically by MongoDB's TTL index (`expireAfterSeconds: 0`), ensuring consistent rate limiting across all instances.

Rate limits enforced:
- General Auth writes: 300 requests per 15 minutes per IP
- Login: 10 attempts per 15 minutes per IP + email
- Connection requests: 25 requests per hour per user
- Messages: 60 messages per minute per user
- Reports: 5 reports per hour per user

### 3. JWT Storage & Token Strategy
Authentication tokens are issued as signed JSON Web Tokens (7-day validity).
- **Client Storage**: `localStorage` (`devsync_auth` key)
- **Tradeoff**: Offers seamless client-side hydration, cross-tab state synchronization, and simplified serverless deployment without cookie domain alignment complexities. To mitigate XSS risks, strict Zod input validation, `express-mongo-sanitize`, and Helmet security headers are enforced across the API. On token expiration or HTTP 401, the client automatically wipes local storage and broadcasts an authorization eviction event.

### 4. Feature Flags
- `FEATURE_MESSAGING`: Controls the direct and team messaging system.
- `FEATURE_IDEAS`: Controls the Ideas Hub.
When set to `false`, corresponding API endpoints respond with `404 Not Found` and navigation links are hidden.

---

## 1. MongoDB Atlas Setup

1. Sign in at [cloud.mongodb.com](https://cloud.mongodb.com) and create an M0 free tier cluster.
2. In **Database Access**, create a user with `readWrite` privileges on the `devsync` database.
3. In **Network Access**, add `0.0.0.0/0` (Allow access from anywhere, required for serverless functions).
4. In **Database** → **Connect** → **Drivers (Node.js)**, copy your connection string:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/devsync?retryWrites=true&w=majority`

---

## 2. Environment Variables Configuration

Set these environment variables on Vercel:

| Variable | Description | Example / Required |
| --- | --- | --- |
| `NODE_ENV` | Production environment flag | `production` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Strong secret for signing JWTs | 64+ char random hex string |
| `CLIENT_ORIGIN` | Allowed production origin(s) | `https://your-app.vercel.app` |
| `ADMIN_EMAILS` | Comma-separated admin emails | `admin@youruniversity.edu` |
| `FEATURE_MESSAGING` | Toggle messaging features | `true` or `false` |
| `FEATURE_IDEAS` | Toggle ideas hub features | `true` or `false` |
| `RESEND_API_KEY` | (Optional) Resend API Key for student email verification | `re_...` |
| `MAIL_FROM` | (Optional) Verified sender email for verification emails | `DevSync <verify@devsync.app>` |
| `GOOGLE_CLIENT_ID` | (Optional) Google OAuth Client ID | `...apps.googleusercontent.com` |

---

### College Email Verification Setup

DevSync includes academic email verification (`.edu` / `.ac.*`) to award students with the **Verified Student Builder** badge.

1. **Production Setup (Resend)**:
   - Create a free account at [resend.com](https://resend.com) and add your domain.
   - Generate an API key and set `RESEND_API_KEY=re_...` in your deployment environment variables.
   - Set `MAIL_FROM=DevSync <verify@yourdomain.com>`.
2. **Local Development / Testing**:
   - When `RESEND_API_KEY` is not present, the application operates in safe simulation mode. Verification links with signed tokens are logged directly to the server console and surfaced to the student in the verification UI for instant local testing without external email dependencies.

---

## 3. Deployment Steps

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Deploy DevSync"
   git push origin main
   ```
2. Import the project in [vercel.com](https://vercel.com).
3. Configure the environment variables listed above.
4. Click **Deploy**.

---

## 4. Verification

- Hit `/api/health` — returns `{"ok": true, "service": "devsync-server"}`.
- Visit your Vercel deployment URL and verify student signup, team creation, and hackathon discovery.
