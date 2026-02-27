# ⚓ MarineTrack — Maritime Document Management System

A full-stack automated maritime document expiry tracking system built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **PostgreSQL (Neon)**, and **Prisma**.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via **Neon** |
| ORM | Prisma |
| Auth | NextAuth v5 (credentials) |
| Charts | Chart.js + react-chartjs-2 |
| Hosting | Vercel |

---

## 📦 Project Structure

```
maritime-system/
├── prisma/
│   ├── schema.prisma        # All DB models
│   └── seed.ts              # Sample maritime data
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Redirects to /dashboard or /login
│   │   ├── login/
│   │   │   └── page.tsx     # Login page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx   # Protected layout with sidebar
│   │   │   ├── page.tsx     # Main dashboard
│   │   │   ├── vessels/     # Vessel certificates CRUD (extend here)
│   │   │   ├── crew/        # Crew documents CRUD (extend here)
│   │   │   ├── permits/     # Port permits CRUD (extend here)
│   │   │   └── inspections/ # Ship inspections CRUD (extend here)
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── vessel-certificates/route.ts
│   │       └── cron/update-statuses/route.ts  # Auto-status updater
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   └── dashboard/
│   │       ├── StatsCards.tsx
│   │       ├── AlertsPanel.tsx
│   │       ├── ExpiryDonutChart.tsx
│   │       ├── CategoryBarChart.tsx
│   │       └── RecentAlertsTable.tsx
│   ├── lib/
│   │   ├── auth.ts          # NextAuth config
│   │   ├── prisma.ts        # Prisma singleton
│   │   ├── utils.ts         # Expiry helpers, urgency logic
│   │   └── actions/
│   │       └── dashboard.ts # Server actions for dashboard data
│   └── middleware.ts        # Route protection
├── vercel.json              # Cron job config (runs daily at midnight)
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## ⚙️ Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo>
cd maritime-system
npm install
```

### 2. Set Up Neon Database

1. Go to [console.neon.tech](https://console.neon.tech) → Create a new project
2. Copy the **Connection String** (with `?sslmode=require`)

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="your-cron-secret-for-scheduler"
```

### 4. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Neon
npm run db:push

# Seed with sample data
npm run db:seed
```

### 5. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🔐 Demo Login Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@maritime.ph | admin123 |
| Manager | manager@maritime.ph | staff123 |
| Staff | staff@maritime.ph | staff123 |

---

## 🎨 Dashboard Features

### Expiry Color Coding
| Color | Urgency | When |
|-------|---------|------|
| 🔴 Red | Expired | Past due date |
| 🟠 Orange | Critical | ≤ 30 days left |
| 🟡 Yellow | Warning | 31–60 days left |
| 🔵 Cyan | Caution | 61–90 days left |
| 🟢 Green | Valid | > 90 days left |

### Tracked Document Types
- **Vessel Certificates** — SMC, Load Line, Tonnage, IOPP, etc.
- **Crew Documents** — STCW, Medical Fitness, OOW License, etc.
- **Port Permits** — Port Entry, PSC Clearance, Dangerous Goods
- **Ship Inspections** — Annual Safety, Hull & Machinery, MARPOL

---

## 🤖 Automation — Auto Status Update

The system **automatically updates document statuses** every day at midnight via a Vercel Cron Job:

```
/api/cron/update-statuses  →  runs daily at 00:00 UTC
```

Configured in `vercel.json`. It scans all documents and sets:
- `EXPIRED` if past expiry date
- `EXPIRING_SOON` if within 90 days
- `VALID` otherwise

To trigger manually (with your `CRON_SECRET`):
```bash
curl -H "x-cron-secret: YOUR_SECRET" https://yourapp.vercel.app/api/cron/update-statuses
```

---

## 🚀 Deploy to Vercel

```bash
npm install -g vercel
vercel

# Set env vars in Vercel dashboard:
# DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, CRON_SECRET
```

Or connect your GitHub repo to Vercel for automatic deployments.

---

## 📈 Extending the System

To add full CRUD pages for each module:

```
src/app/dashboard/vessels/page.tsx     ← Vessel cert list + add form
src/app/dashboard/crew/page.tsx        ← Crew doc list + add form
src/app/dashboard/permits/page.tsx     ← Port permit list + add form
src/app/dashboard/inspections/page.tsx ← Inspection list + add form
```

Each page can use the existing API routes and Prisma models. The schema is already fully defined!
