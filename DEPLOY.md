# Deploying DevSync to Vercel + MongoDB Atlas

DevSync is deployed as **one integrated Vercel project**:
- React 18 frontend built with Vite into `client/dist`
- Express REST API served by the Vercel function at `api/index.js`
- Frontend and API share one domain; the client calls the API using the relative `/api` path

## Vercel project settings

Import the repository into Vercel and configure the project with the repository root as the **Root Directory** (`.`):

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Install Command | `npm run install:all` |
| Build Command | `npm run build` |
| Output Directory | `client/dist` |

`vercel.json` contains these settings and routes `/api/*` to the serverless API while routing frontend paths to the Vite app. Do not set the Vercel Root Directory to `client`, since the API and root Vercel configuration live at the repository root.

## Required production environment variables

Set these in Vercel for the Production environment before deploying. The API returns a configuration error until the required values are present.

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Strong, unique secret for signing JWTs (not `change-me`) |
| `ADMIN_EMAILS` | Comma-separated admin email addresses; required by production config validation |

Set `CLIENT_ORIGIN` to the deployed app origin if needed for cross-origin API clients. For the integrated same-origin deployment, the frontend uses `/api` on the same host.

Optional features and email configuration:

| Variable | Description |
| --- | --- |
| `FEATURE_MESSAGING` | Set to `true` to enable messaging |
| `FEATURE_IDEAS` | Set to `true` to enable Ideas Hub |
| `RESEND_API_KEY` | Optional Resend API key for verification email |
| `MAIL_FROM` | Optional verified sender address |
| `GOOGLE_CLIENT_ID` | Optional Google OAuth client ID |

## Deployment and verification

1. Push changes to the connected GitHub branch (the repository's default branch is `master`) or trigger a deployment from Vercel.
2. Add the required Production environment variables in Vercel, then redeploy so they take effect.
3. Open the Vercel deployment URL and verify the frontend loads.
4. Check `/api/health`; it should return `{"ok":true,"service":"devsync-server"}` when the API and database configuration are healthy.

Vite uses `/` as its production base on Vercel. The `/DevSync/` base is selected only for GitHub Actions builds that publish to GitHub Pages. React Router uses Vite's `BASE_URL` so direct navigation works under either deployment path.
