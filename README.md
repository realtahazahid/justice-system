# Sahi Law Chamber - Legal Case Management System

A production-ready, highly secure Legal Case Management System built for a Supreme Court advocate to manage case files, clients, hearings schedule, billing ledgers, and PDF documents.

## 🛠️ Technology Stack
*   **Framework:** Next.js 15 App Router
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (v4)
*   **ORM:** Prisma ORM (v7)
*   **Database:** Neon PostgreSQL
*   **Authentication:** NextAuth (Session Credentials Provider)
*   **Deployment:** Vercel

---

## ⚡ Key System Features
1.  **Chamber Dashboard:** At-a-glance metrics for total, active, and closed cases, total pending fees, and a dynamic schedule of upcoming hearings.
2.  **Audit Trail:** Immutable timeline tracking (`CaseHistory` table) for all activities (case creation, hearing schedules, billing receipts, file uploads, closures) linked to the actor.
3.  **Preventing Accidental Deletions:** Database foreign keys restrict hard Case deletion if histories or hearings exist. Soft-delete columns hide records while retaining logs.
4.  **PDF Records Vault:** PDF briefs are stored directly inside Neon PostgreSQL as binary data (`Bytes`/`bytea` type), avoiding file loss on ephemeral Vercel containers.
5.  **Referral Network Directory:** Aggregated dashboard panel counting the cases referred to your chamber by each referrer.
6.  **Secure Password Form:** Settings page password update widget (email is locked for safety).
7.  **Data Export & Print Center:** Downloads JSON database snapshots, exports CSV spreadsheets for MS Excel, and prints print-friendly CSS summaries.

---

## 🚀 Getting Started Locally

### 1. Setup Environment
Create a `.env` file at the root of the project:
```bash
# Database URL (Neon PostgreSQL connection string)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secure-nextauth-encryption-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Deploy Schema Tables
Sync your connected database with the Prisma schema models:
```bash
npx prisma db push
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Administrative Login (Auto-Seed)
Log in on the portal login screen with:
*   **Username:** `admin@sahilaw.com`
*   **Password:** `admin123` *(or any custom password you submit on your very first run)*

*If the user table is empty, this account is auto-seeded into the database using secure password hashes.*
