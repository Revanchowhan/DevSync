# DevSync — Shared Contract (backend ↔ frontend)

Tagline: "Different Skills. Same Goals. Stronger Teams."

Project root: `devsync`
- Backend: `server/` — Node.js + Express + Mongoose REST API on **port 5000**
- Frontend: `client/` — React 18 + Vite + Tailwind on **port 5173**, dev proxy `/api` → `http://localhost:5000`

## Auth & Security
- Header: `Authorization: Bearer <token>` (JWT, 7-day expiry)
- `req.user = { id, role }` where role ∈ `student | host`
- Backend implements `requireAuth` and `requireRole('student' | 'host')` middleware.
- Stricter rate limits (MongoDB TTL-backed `RateLimitRecord`):
  - Auth write routes: 300 req / 15 min
  - Login attempts: 10 req / 15 min (keyed by IP + email)
  - Connection requests: 25 req / hour
  - Direct & team messages: 60 req / min
  - User reports: 5 req / hour
- Production environment validation: refuses to start if `JWT_SECRET` is unset or equals `"change-me"`, or if `MONGODB_URI` / `ADMIN_EMAILS` are unset.
- Public Student Serializer (`toPublicStudent(user)`):
  Strict allowlist: `_id, name, role, college, university, branch, year, skills, avatarUrl, interests, preferredRoles, experienceLevel, availability, pastProjects, achievements, github, linkedin, bio, profileVisibility, onboardingCompleted, emailVerified, createdAt, updatedAt`.
  Guaranteed forbidden keys: `passwordHash, email, tokens, googleId, __v, isAdmin, hostStatus, hostStatusNote, termsAcceptedAt, verificationToken, resetPasswordToken, emailVerificationToken, blockedUsers`.

## REST API (all under /api, JSON)

### Config & Health
- `GET /api/health` → `{"ok":true,"service":"devsync-server"}`
- `GET /api/config` → `{"features":{"messaging":boolean,"ideas":boolean}}`

### Auth
- `POST /api/auth/register/student` body: `{name,email,password,college,branch,year,skills:[{name,level}],github,linkedin,bio}` → 201 `{token,user}`
  Skills are normalized to canonical taxonomy on write.
- `POST /api/auth/register/host` body: `{name,organization,email,password}` → 201 `{pendingApproval:true,user}`
- `POST /api/auth/login` body: `{email,password}` → 200 `{token,user}`
- `POST /api/auth/google` body: `{idToken, mode, role, ...}` → 200 / 201 `{token, user}`
- `GET /api/auth/me` (auth) → 200 `{user}`

### Users & Profiles
- `GET /api/users/me` → `{user: {...user, completionPercentage}}`
- `PUT /api/users/me` (student) editable: `name,college,university,branch,year,skills,avatarUrl,interests,preferredRoles,experienceLevel,availability,pastProjects,achievements,github,linkedin,bio,profileVisibility,onboardingCompleted`.
- `GET /api/users/host-requests` (admin) → `{pending, hosts}`
- `POST /api/users/host-requests/:id/approve` (admin)
- `POST /api/users/host-requests/:id/reject` (admin) body: `{note}`

### Student Discovery & Connections (Milestone 2)
- `GET /api/students?search=&skills=&college=&branch=&year=&role=&experience=&availability=&cursor=&limit=` (student)
  Returns cursor-paginated list of public students with explainable matching scores:
  `{students: [{...publicStudent, match: {score, breakdown, reason}}], nextCursor, hasMore}`
  Matching weights:
  - Skill complementarity: 40 points
  - Shared interests: 20 points
  - Role fit: 20 points
  - Availability: 10 points
  - Experience: 10 points
  Total = 100 points.
- `POST /api/connections` body: `{recipientId, message}` → 201 `{connection}`
- `GET /api/connections?status=pending|accepted|declined&type=received|sent` → `{connections:[...]}`
- `PUT /api/connections/:id/accept` (recipient only)
- `PUT /api/connections/:id/decline` (recipient only)
- `DELETE /api/connections/:id` (cancel pending or remove accepted)

### Ideas Hub (Milestone 3, behind FEATURE_IDEAS)
- `POST /api/ideas` body: `{title, description, domain, requiredSkills, preferredRoles, teamSize, hackathonId}` → 201 `{idea}`
- `GET /api/ideas?search=&domain=&skill=&status=open&cursor=&limit=` → `{ideas:[...], nextCursor, hasMore}`
- `GET /api/ideas/:id` → `{idea}`
- `PUT /api/ideas/:id/close` (owner only)
- `POST /api/ideas/:id/interest` body: `{message}` (student) → 201
- `PUT /api/ideas/:id/interest/:applicantId` body: `{status: 'accepted'|'declined'}` (owner only)
- `POST /api/ideas/:id/convert` (owner only) → 201 `{team}` (atomically converts idea to team workspace)

### Team Workspaces & Tasks (Milestone 3)
- `GET /api/teams/:id/workspace` (members only) → `{workspace: {team, tasks, links, members}}`
- `POST /api/teams/:id/links` body: `{title, url}` (members only) → 201 `{link}`
- `DELETE /api/teams/:id/links/:linkId` (members only)
- `POST /api/teams/:id/tasks` body: `{title, description, assignee, status, dueDate}` (members only) → 201 `{task}`
- `PUT /api/teams/:id/tasks/:taskId` body: `{title, description, assignee, status, dueDate}` (members only)
- `DELETE /api/teams/:id/tasks/:taskId` (members only)
- `PUT /api/teams/:id/transfer` body: `{newLeaderId}` (owner only)
- `POST /api/teams/:id/leave` (member only)

### Unified Requests Aggregator (Milestone 3)
- `GET /api/requests/all?tab=received|sent|accepted|declined|all&type=team_request|connection|idea_interest|all`
  Returns normalized requests with direction, status, other user profile, and title.

### Conversations & Messaging (Milestone 4, behind FEATURE_MESSAGING)
- `GET /api/conversations` (auth) → `{conversations: [{...conv, participants, unreadCount}]}`
- `POST /api/conversations/direct` body: `{recipientId}` (accepted connections only, 403 if blocked)
- `POST /api/conversations/team/:teamId` (current team members only)
- `GET /api/conversations/:id/messages?after=cursor&limit=` (participants only)
- `POST /api/conversations/:id/messages` body: `{text}` (participants only, rate limited 60/min)
- `POST /api/conversations/:id/read` (updates lastRead timestamp)
- `GET /api/conversations/unread-total` → `{unreadTotal: number}`

### Safety, Moderation & Verification (Milestone 4)
- `POST /api/safety/report` body: `{targetUserId, reason, details}` (rate limited 5/hr)
- `POST /api/safety/block` body: `{targetUserId}` (immediately severs connections and stops interaction)
- `DELETE /api/safety/block/:targetUserId` (unblock)
- `GET /api/safety/blocked` → `{blocked: [...]}`
- `POST /api/safety/verify-email/request` body: `{collegeEmail}` (sends 24h token to academic email)
- `POST /api/safety/verify-email/confirm` body: `{token}` → `{verified: true}` (unlocks verified student badge)
- `DELETE /api/safety/account` body: `{password}` (permanently deletes account and anonymizes data)

### Hackathons & Teams (Base)
- `GET /api/hackathons?search=&skill=&status=&from=&to=` → `{hackathons:[...]}`
- `GET /api/hackathons/:id` → `{hackathon}`
- `POST /api/hackathons/:id/register` (student)
- `POST /api/hackathons` (host)
- `GET /api/teams/my?hackathonId=` → `{teams:[...]}`
- `POST /api/teams` body: `{hackathonId,name,description,missingSkills:[{name}]}` → 201 `{team}`
- `GET /api/teams/:id` → `{team}` with `members, openSpots, skillGap`

### Notifications
- `GET /api/notifications` → `{notifications:[...]}`
- `PUT /api/notifications/:id/read`
- `GET /api/notifications/unread-count` → `{count}`
