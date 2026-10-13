# Shoora EB-5 — Complete Setup Guide

> **This document explains how to configure and deploy the complete Shoora EB-5 application.**
> You must follow all steps before the application will handle real authentication, AI responses, and spreadsheet synchronization.

---

## Prerequisites

- Node.js 18+
- A Supabase account (free tier works for development)
- Access to one of: OpenAI, Google Gemini, or Anthropic
- (For phone OTP) A Twilio account
- (For Excel) A Microsoft 365 account with OneDrive for Business or SharePoint
- (For Google Sheets) A Google Cloud account

---

## 1. Initial Project Setup

```bash
# Clone / open the project
cd shoora-eb5

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

---

## 2. Supabase Setup

### 2a. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **Anon Key** from Project Settings → API.
3. Note your **Service Role Key** (keep this secret — server-side only).

### 2b. Configure .env

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2c. Run database migrations

In the Supabase Dashboard → SQL Editor, paste and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

Or using the Supabase CLI:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### 2d. Configure Email OTP

1. Supabase Dashboard → Authentication → Providers → Email
2. Enable **Email OTP** (or magic link — the app handles both)
3. Customize the OTP email template if desired
4. Set `MAILER_OTP_EXP` to your preferred expiry (default: 3600 seconds)

### 2e. Configure Phone SMS OTP (Twilio)

1. Create a Twilio account at [twilio.com](https://twilio.com)
2. Get your Account SID, Auth Token, and a Twilio phone number
3. In Supabase Dashboard → Authentication → Providers → Phone:
   - Select **Twilio** as provider
   - Enter your Twilio Account SID and Auth Token
   - Enter your Twilio phone number
4. Add to your server environment (NOT .env for frontend):
   ```
   SMS_PROVIDER_ACCOUNT_ID=ACxxxxxxx
   SMS_PROVIDER_AUTH_TOKEN=your-auth-token
   SMS_PROVIDER_FROM_NUMBER=+1xxxxxxxxxx
   ```

### 2f. Create your admin user

After running the app and signing in with your admin email:
1. Get your `auth.users` UUID from Supabase Dashboard → Authentication → Users
2. Run in SQL Editor:
   ```sql
   INSERT INTO admin_users (auth_user_id, role)
   VALUES ('your-auth-user-uuid', 'admin');
   ```

### 2g. Deploy Edge Functions

```bash
npx supabase functions deploy chat
npx supabase functions deploy sync-lead
npx supabase functions deploy process-sync-jobs
npx supabase functions deploy test-integration
```

Set secrets in the Supabase Edge Function environment:

```bash
npx supabase secrets set AI_PROVIDER_API_KEY=sk-your-key
npx supabase secrets set AI_PROVIDER=openai
npx supabase secrets set AI_MODEL=gpt-4o
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
```

---

## 3. AI Provider Setup

### OpenAI (recommended)

1. Create an API key at [platform.openai.com](https://platform.openai.com)
2. Set as a Supabase Edge Function secret:
   ```bash
   npx supabase secrets set AI_PROVIDER_API_KEY=sk-your-key
   npx supabase secrets set AI_PROVIDER=openai
   npx supabase secrets set AI_MODEL=gpt-4o
   ```

### Google Gemini

```bash
npx supabase secrets set AI_PROVIDER=gemini
npx supabase secrets set AI_PROVIDER_API_KEY=your-gemini-key
npx supabase secrets set AI_MODEL=gemini-1.5-pro
```

---

## 4. Microsoft Excel Setup

### 4a. Create the workbook

1. In OneDrive for Business or SharePoint, create `Shoora_EB5_Leads.xlsx`
2. Create a worksheet named `Customer Leads`
3. Add the following headers in row 1 (A1–S1):
   ```
   Lead ID | Created Date | Full Name | Verified Email | Verified Phone |
   Country of Residence | Preferred Contact Method | Interest Category |
   Investment Timeframe | Optional Budget Range | Lead Status |
   Engagement Score | Consultation Requested | Follow-Up Consent |
   Last Interaction Date | Lead Source | Assigned Advisor | Admin Notes | Sync Status
   ```
4. Format A1:S1 as a named Table called `ShooraLeads`

### 4b. Register an app in Microsoft Entra ID

1. Go to [portal.azure.com](https://portal.azure.com) → Entra ID → App registrations → New registration
2. Name: `Shoora EB-5 Integration`
3. Note the **Application (client) ID** and **Directory (tenant) ID**
4. Create a client secret under Certificates & Secrets → New client secret
5. Add API Permissions → Microsoft Graph → Application permissions → `Files.ReadWrite.All`
6. Grant admin consent

### 4c. Get workbook identifiers

Using Microsoft Graph Explorer or the API:
```
GET https://graph.microsoft.com/v1.0/me/drive/root:/Shoora_EB5_Leads.xlsx
```
Note the `id` (workbook item ID) and the drive ID.

### 4d. Set secrets

```bash
npx supabase secrets set MICROSOFT_TENANT_ID=your-tenant-id
npx supabase secrets set MICROSOFT_CLIENT_ID=your-client-id
npx supabase secrets set MICROSOFT_CLIENT_SECRET=your-client-secret
npx supabase secrets set MICROSOFT_DRIVE_ID=your-drive-id
npx supabase secrets set MICROSOFT_WORKBOOK_ITEM_ID=your-workbook-item-id
```

### 4e. Enable integration in database

```sql
UPDATE spreadsheet_integrations
SET enabled = TRUE, configuration_status = 'configured'
WHERE provider = 'excel';
```

### 4f. Test

In Admin Dashboard → Integrations → click **Test Connection** next to Excel.

---

## 5. Google Sheets Setup

### 5a. Create the spreadsheet

1. Create a Google Sheet named `Shoora EB5 Leads`
2. Create a sheet tab named `Customer Leads`
3. Add the same 19 column headers as Excel (row 1)
4. Note the Spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

### 5b. Option A: Service Account (recommended for server-to-server)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Google Sheets API**
3. IAM & Admin → Service Accounts → Create service account
4. Create a JSON key — download it
5. Share the spreadsheet with the service account email (Editor access)
6. Set secret:
   ```bash
   npx supabase secrets set GOOGLE_SERVICE_ACCOUNT_CREDENTIALS='{"type":"service_account",...}'
   npx supabase secrets set GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
   ```

### 5b. Option B: OAuth 2.0

1. Google Cloud Console → OAuth 2.0 Client IDs → Web application
2. Set redirect URI to your app's callback URL
3. Complete the OAuth consent screen
4. Authorize the app as admin and store the refresh token
5. Set secrets:
   ```bash
   npx supabase secrets set GOOGLE_CLIENT_ID=your-client-id
   npx supabase secrets set GOOGLE_CLIENT_SECRET=your-client-secret
   npx supabase secrets set GOOGLE_REFRESH_TOKEN=your-refresh-token
   npx supabase secrets set GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
   ```

### 5c. Enable integration

```sql
UPDATE spreadsheet_integrations
SET enabled = TRUE, configuration_status = 'configured'
WHERE provider = 'google_sheets';
```

### 5d. Test

Admin Dashboard → Integrations → **Test Connection** next to Google Sheets.

---

## 6. Running Locally

```bash
npm run dev
```

Open http://localhost:5173

The app runs in development mode. If Supabase is not configured, you will see placeholder warnings but the UI is fully navigable.

---

## 7. Deployment (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Configure environment variables in Vercel Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `PUBLIC_APP_URL` (your Vercel deployment URL)

**Do NOT add server-side secrets to Vercel frontend env vars.**
Server-side secrets live only in Supabase Edge Function secrets.

Update Supabase authorized redirect URLs:
- Authentication → URL Configuration → Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/**`

---

## 8. Automated Sync Job Processing

The sync processor (`process-sync-jobs`) can be invoked:

1. **On-demand**: Called automatically after each consultation submission
2. **Scheduled**: Enable pg_cron in Supabase and uncomment the cron schedule in the migration
3. **Manual retry**: Via Admin Dashboard → Integrations → Retry buttons

---

## 9. Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never in frontend code or public env vars
- [ ] `MICROSOFT_CLIENT_SECRET` is stored only in Supabase secrets
- [ ] `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` is stored only in Supabase secrets  
- [ ] `.env` is in `.gitignore`
- [ ] RLS policies are enabled on all tables
- [ ] Admin users are explicitly added to `admin_users` table
- [ ] Supabase redirect URLs are restricted to known domains
- [ ] Edge functions are not publicly callable without authentication (use service role internally)

---

## 10. Acceptance Test Checklist

- [ ] Email OTP delivered and verified
- [ ] SMS OTP delivered and verified (requires Twilio)
- [ ] Expired OTP codes rejected
- [ ] Anonymous user can ask EB-5 questions
- [ ] Assistant does not fabricate company claims
- [ ] Consultation form creates a lead in Supabase
- [ ] Lead appears in admin dashboard
- [ ] Excel sync job created and processed
- [ ] Google Sheets sync job created and processed
- [ ] Failed sync job shown in admin → retry succeeds without duplicate row
- [ ] Admin-only pages return 401/redirect for unauthorized users
- [ ] `MICROSOFT_CLIENT_SECRET` not visible in browser network tab

---

*Shoora EB-5 — Setup Guide v1.0*
