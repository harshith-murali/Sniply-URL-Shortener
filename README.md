<p align="center">
  <img src="https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Upstash_Redis-00E599?style=for-the-badge&logo=redis&logoColor=black" />
  <img src="https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

# 🔗 Sniply — High-Performance Smart URL Shortener

> A lightning-fast, production-ready full-stack URL shortener and analytics platform built with Next.js (App Router), MongoDB, and Clerk. Engineered for sub-20ms HTTP 307 redirects, non-blocking asynchronous analytics via Next.js `after()`, Upstash Redis rate limiting, and instant QR code generation.

🔗 **Live Demo:** [url-shortner-silk-nine.vercel.app](https://url-shortner-silk-nine.vercel.app)  
📦 **Repository:** [github.com/harshith-murali/Sniply-URL-Shortener](https://github.com/harshith-murali/Sniply-URL-Shortener)

---

## 🚀 Key Features

- **Sub-20ms HTTP 307 Redirects**: Non-blocking request lifecycle where redirects return immediately, moving click ingestion, IP parsing, and MongoDB writes to the background.
- **Custom Vanity Aliases**: Users can specify human-readable slugs (`/my-launch`) with automatic alias normalization and collision prevention.
- **Sliding-Window Rate Limiting**: Powered by `@upstash/ratelimit` and Upstash Redis with deterministic IP-based fallbacks to protect endpoints from abuse.
- **Dynamic QR Code Generation**: Instant high-resolution downloadable QR codes for every shortened link.
- **Comprehensive Click Analytics**: Interactive 30-day timeline charts, breakdown by browser, OS, device form-factor (Desktop/Mobile/Tablet), and HTTP referrer.
- **Optimized MongoDB Pipeline**: Aggregation queries utilize `.lean()` to bypass Mongoose hydration overhead and leverage compound indexes.
- **Anonymous & Authenticated Shortening**: Guest users can shorten links immediately; authenticated users unlock a personal management dashboard.
- **Soft Deletion**: Preserves historical click analytics while deactivating redirect resolution.
- **Clerk Authentication**: Google OAuth and email/password sign-in with dark/light theme synchronization.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19 |
| **Database** | MongoDB Atlas with Mongoose ODM |
| **Caching & Rate Limiting** | Upstash Redis (`@upstash/ratelimit`) with in-memory fallback |
| **Authentication** | Clerk Auth (`@clerk/nextjs`, `@clerk/themes`) |
| **QR Generation** | `qrcode` |
| **ID Generation** | `nanoid` (URL-safe 6-character entropy) |
| **Testing** | Vitest (`@vitest/coverage-v8`) |
| **Deployment** | Vercel Serverless Edge Platform |

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── [shortCode]/
│   │   └── route.js          # Sub-20ms 307 redirect engine + background click tracking
│   ├── api/
│   │   ├── shorten/
│   │   │   └── route.js      # POST — rate-limited URL creation & alias validation
│   │   ├── links/
│   │   │   ├── route.js      # GET — authenticated user links list
│   │   │   └── [id]/
│   │   │       └── route.js  # DELETE — soft-deactivate link
│   │   └── analytics/
│   │       └── [shortCode]/
│   │           └── route.js  # GET — parallel MongoDB aggregation pipelines
│   ├── dashboard/
│   │   └── page.jsx          # Protected user management dashboard
│   ├── analytics/
│   │   └── [shortCode]/
│   │       └── page.jsx      # Visual analytics graphs & referrer tables
│   └── layout.jsx            # Root layout with Clerk & theme providers
├── components/
│   ├── ClerkThemeWrapper.jsx # Syncs Clerk modal theme with app dark/light mode
│   ├── ThemeProvider.jsx     # CSS variables theme context
│   └── Navbar.jsx            # Responsive navigation & user button
├── lib/
│   ├── rateLimit.js          # Upstash Redis sliding window limiter
│   ├── aliasUtils.js         # Slug sanitization & reserved keyword rules
│   └── apiErrors.js          # Standardized error response helpers
├── models/
│   └── UrlModel.js           # Url and Click schemas with compound indexes
└── db/
    └── dbConfig.js           # Global MongoDB connection pool caching
```

---

## ⚡ Architecture & Concurrency

### 1. Zero-Latency Redirects via Background Tasks
Instead of blocking HTTP redirects until analytics are persisted:
1. `GET /[shortCode]` queries MongoDB using `.lean()` on index `{ shortCode: 1 }`.
2. Emits HTTP 307 immediately.
3. Fires background persistence for the `Click` document and atomic `$inc` on `Url.clicks` without slowing down the visitor's page transition.

### 2. Double-Check Slug Collision Avoidance
To prevent vanity alias collisions under high concurrency:
- Soft pre-check verifies alias availability in MongoDB.
- MongoDB enforces a hard `unique: true` sparse index on `customAlias`.
- If two requests collide at the exact same millisecond, MongoDB returns error `11000`, caught gracefully by `isDuplicateKeyError()`.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18.x
- **MongoDB Atlas** database URI
- **Clerk** account for API keys
- **Upstash Redis** (optional for distributed rate limiting; in-memory fallback enabled by default)

### 1. Clone & Install
```bash
git clone https://github.com/harshith-murali/Sniply-URL-Shortener.git
cd Sniply-URL-Shortener
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the project root:
```env
# MongoDB Connection
MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/sniply?retryWrites=true&w=majority"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL="https://...upstash.io"
UPSTASH_REDIS_REST_TOKEN="..."

# Base Domain
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 3. Run Development Server
```bash
npm run dev
# Running at http://localhost:3000
```

---

## Database connection troubleshooting on Vercel

If shortening fails, check the project's runtime logs for `/api/shorten`.
An error such as `querySrv ENOTFOUND _mongodb._tcp.<cluster>.mongodb.net`
means the configured Atlas hostname cannot be resolved.

1. In MongoDB Atlas, confirm the cluster still exists and is running. Resume it if paused.
2. Copy its current connection string from **Connect → Drivers**, using the database user's credentials and the intended database name.
3. Update `MONGODB_URI` in the Vercel `url-shortner` project's **Production** environment. Update Preview and Development if they use the same database.
4. Redeploy, create a test short link, and confirm it redirects to the original URL.

Keep the connection string in environment settings and Git-ignored `.env.local` only.
Database connection failures return HTTP 503 with a retry message. The connection cache
clears failed attempts so subsequent requests can reconnect after the database recovers.

---

## 🧪 Testing

```bash
npm run test         # Run Vitest test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage
```

---

## 📄 License
MIT License. Built for Sniply URL Shortener.
