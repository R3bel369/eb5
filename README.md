# Shoora EB-5 — AI Chatbot, Telnyx SMS OTP, CRM & Embed Widget

A complete, production-grade web application for **Shoora EB-5** that combines an intelligent EB-5 immigrant investor chatbot, dual OTP authentication (Email & SMS), automated lead capture, an administrative CRM dashboard, and dual spreadsheet synchronization with **Microsoft Excel** (via Microsoft Graph API) and **Google Sheets** (via Google Sheets API).

---

## 🌟 Key Features

### 1. Dual OTP Authentication
- **Email OTP**: 6-digit one-time passcode delivered via Supabase Auth email provider.
- **SMS Phone OTP**: 6-digit one-time passcode formatted using E.164 standard, delivered via Twilio / MessageBird / Supabase Phone Auth.
- Session persistence, resend countdown timers, country code selector (+1 to +971), and graceful fallback to offline/demo mode when credentials are missing.

### 2. AI-Powered EB-5 Chatbot
- Conversational assistant powered by Supabase Edge Functions (`/functions/v1/chat`) with OpenAI / Gemini support.
- Embedded, USCIS-verified knowledge base covering:
  - RIA 2022 TEA ($800k) & Non-TEA ($1,050k) capital requirements
  - Job creation standards (10 full-time jobs, direct vs. indirect/induced)
  - Visa Set-Asides (20% Rural, 10% High Unemployment, 2% Infrastructure)
  - Concurrent filing (I-526E + I-485 / I-765 / I-131)
  - Step-by-step roadmap: I-526E approval, conditional green card, and I-829 removal of conditions
- Dynamic investor readiness score calculation (0–100 scale).
- In-chat Consultation Request modal collecting investment capacity, timeframe, source of funds, and contact preferences.

### 3. Dual Spreadsheet Integration (Transactional Outbox Pattern)
- Synchronizes authorized lead records simultaneously to:
  - **Microsoft Excel** via Microsoft Graph API (`/me/drive/items/{id}/workbook/tables/{name}/rows`)
  - **Google Sheets** via Google Sheets API v4 (`spreadsheets.values.append`)
- Idempotency guarantees: row updates matched by `lead_id` to prevent duplicate rows.
- Resilient background worker with exponential backoff retry for transient network and rate-limit errors.
- Integration health telemetry tracking `last_success_at`, `last_error_at`, and detailed error logs.

### 4. Comprehensive Admin CRM Dashboard
- **KPI Metrics**: Total leads, new inquiries, consultation requests, follow-ups needed, and integration sync health.
- **Lead Pipeline**: Search, filter by status and qualification score, status transition modal, advisor assignment, admin notes, and CSV export.
- **Conversation Explorer**: Split-view history browser to review transcripts between prospective investors and the AI.
- **Integrations & Sync Manager**: Real-time health indicators, one-click connection tests, and granular retry controls for failed sync jobs.

---

## 📂 Project Architecture

```
shoora-eb5/
├── src/
│   ├── components/
│   │   ├── admin/             # Admin dashboard panels (Overview, Leads, Integrations, Conversations)
│   │   ├── auth/              # Dual OTP auth components (EmailOtpForm, PhoneOtpForm, UserMenu)
│   │   ├── chat/              # Chat interface (MessageList, Input, ConsultationForm, QuickActions)
│   │   └── common/            # Navigation, Footer, Badges, Toasts
│   ├── contexts/              # AuthContext and ChatContext state providers
│   ├── lib/                   # Supabase client, static knowledge base, and utility helpers
│   ├── pages/                 # Full-page routes (Home, Chat, Auth, Admin, EB-5 Info, How It Works, FAQ, Contact)
│   ├── types/                 # Database and domain TypeScript definitions
│   ├── App.tsx                # Client-side router and toast configuration
│   └── main.tsx               # Application entry point
├── supabase/
│   ├── functions/             # Deno Edge Functions
│   │   ├── chat/              # AI chatbot inference with context window management
│   │   ├── sync-lead/         # Idempotent lead sync dispatcher (outbox pattern)
│   │   ├── process-sync-jobs/ # Worker for Excel (Graph API) and Google Sheets API
│   │   └── test-integration/  # Live connectivity health-check endpoint
│   └── migrations/
│       └── 001_initial_schema.sql # 8 tables, indexes, RLS policies, and pg_cron scheduler
├── .env.example               # Template for environment configuration
├── SETUP_GUIDE.md             # End-to-end setup and deployment instructions
└── tailwind.config.js         # Curated luxury navy/gold/ivory palette design system
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ and npm
- (Optional) Supabase CLI for deploying edge functions and database migrations

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your Supabase URL and anon key:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Production Build
```bash
npm run build
```

---

## 🗄️ Database & Integration Setup

Refer to [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) for detailed step-by-step instructions on:
1. Running the SQL schema migration in Supabase.
2. Configuring Email & SMS Twilio OTP in Supabase Auth.
3. Setting up Azure App Registration for Microsoft Graph API (Excel).
4. Creating a Google Cloud Service Account for Google Sheets API v4.
5. Deploying and scheduling the Edge Functions.
>>>>>>> 7894765 (Shoora EB-5 AI Chatbot with Telnyx SMS OTP and Embed Widget)
