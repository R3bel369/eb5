-- ============================================================
-- SHOORA EB-5 — Complete Supabase Database Setup
-- Run this script in: https://supabase.com/dashboard/project/dpbteppljmrorqiklsua/sql/new
-- ============================================================

-- ── 1. Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2. admin_users Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'advisor')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. user_profiles Table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id              UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name                 TEXT,
  verified_email            TEXT,
  verified_phone            TEXT,
  country_of_residence      TEXT,
  preferred_contact_method  TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'either')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user ON user_profiles(auth_user_id);

-- ── 4. leads Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name                 TEXT,
  verified_email            TEXT,
  verified_phone            TEXT,
  country_of_residence      TEXT,
  preferred_contact_method  TEXT,
  interest_category         TEXT,
  investment_timeframe      TEXT,
  optional_budget_range     TEXT,
  investment_capacity       TEXT,
  source_of_funds           TEXT,
  current_visa_status       TEXT,
  lead_status               TEXT NOT NULL DEFAULT 'new_inquiry'
                              CHECK (lead_status IN (
                                'new_inquiry','interested','consultation_requested',
                                'follow_up_required','qualified_by_advisor','contacted','closed'
                              )),
  engagement_score          INTEGER NOT NULL DEFAULT 60 CHECK (engagement_score BETWEEN 0 AND 100),
  consultation_requested    BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_consent         BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_email_consent   BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_sms_consent     BOOLEAN NOT NULL DEFAULT FALSE,
  lead_source               TEXT DEFAULT 'ai_chatbot',
  assigned_advisor          TEXT,
  admin_notes               TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_interaction_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (auth_user_id),
  UNIQUE NULLS NOT DISTINCT (verified_email)
);

CREATE INDEX IF NOT EXISTS idx_leads_auth_user     ON leads(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_email         ON leads(verified_email);
CREATE INDEX IF NOT EXISTS idx_leads_status        ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_created       ON leads(created_at DESC);

-- ── 5. conversations Table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id                   UUID REFERENCES leads(id) ON DELETE SET NULL,
  session_token             TEXT,
  conversation_status       TEXT NOT NULL DEFAULT 'active'
                              CHECK (conversation_status IN ('active', 'completed', 'abandoned')),
  metadata                  JSONB DEFAULT '{}'::jsonb,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_auth_user ON conversations(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead      ON conversations(lead_id);

-- ── 6. messages Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type     TEXT NOT NULL CHECK (sender_type IN ('user', 'assistant', 'system')),
  message_content TEXT NOT NULL,
  sources         JSONB DEFAULT '[]'::jsonb,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created      ON messages(created_at ASC);

-- ── 7. consent_records Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_records (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id              UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  consent_type         TEXT NOT NULL CHECK (consent_type IN ('follow_up', 'marketing_email', 'marketing_sms', 'terms_of_service')),
  consent_status       BOOLEAN NOT NULL,
  consent_text_version TEXT NOT NULL DEFAULT 'v1.0',
  ip_address           TEXT,
  user_agent           TEXT,
  recorded_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_lead ON consent_records(lead_id);

-- ── 8. spreadsheet_integrations Table ─────────────────────────
CREATE TABLE IF NOT EXISTS spreadsheet_integrations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider             TEXT NOT NULL UNIQUE CHECK (provider IN ('excel', 'google_sheets')),
  configuration_status TEXT NOT NULL DEFAULT 'unconfigured'
                         CHECK (configuration_status IN ('unconfigured', 'configured', 'error')),
  spreadsheet_id       TEXT,
  worksheet_name       TEXT,
  auth_credentials     JSONB,
  last_success_at      TIMESTAMPTZ,
  last_error_at        TIMESTAMPTZ,
  last_error_message   TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default integration rows
INSERT INTO spreadsheet_integrations (provider, configuration_status, worksheet_name)
VALUES
  ('excel', 'configured', 'Shoora_Leads'),
  ('google_sheets', 'configured', 'Shoora_EB5_Leads')
ON CONFLICT (provider) DO NOTHING;

-- ── 9. spreadsheet_sync_jobs Table ────────────────────────────
CREATE TABLE IF NOT EXISTS spreadsheet_sync_jobs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                 UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  provider                TEXT NOT NULL CHECK (provider IN ('excel', 'google_sheets')),
  sync_status             TEXT NOT NULL DEFAULT 'pending'
                            CHECK (sync_status IN ('pending', 'processing', 'synced', 'failed', 'retry_scheduled')),
  idempotency_key         TEXT NOT NULL UNIQUE,
  row_identifier          TEXT,
  payload_snapshot        JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempt_count           INTEGER NOT NULL DEFAULT 0,
  max_attempts            INTEGER NOT NULL DEFAULT 5,
  last_attempt_at         TIMESTAMPTZ,
  next_attempt_at         TIMESTAMPTZ DEFAULT NOW(),
  last_error              TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_lead     ON spreadsheet_sync_jobs(lead_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status   ON spreadsheet_sync_jobs(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_provider ON spreadsheet_sync_jobs(provider);

-- ── 10. knowledge_base Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_base (
  id            TEXT PRIMARY KEY,
  category      TEXT NOT NULL DEFAULT 'General EB-5',
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  tags          TEXT[] DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_active   ON knowledge_base(is_active);

-- Seed Baseline Knowledge Base Entries
INSERT INTO knowledge_base (id, category, question, answer, tags, is_active)
VALUES
  (
    'kb-1',
    'Investment Capital',
    'What is the minimum investment amount for the EB-5 visa under RIA 2022?',
    'Under the EB-5 Reform and Integrity Act of 2022 (RIA), the minimum qualifying investment is $800,000 for projects located in a Targeted Employment Area (TEA) — either a Rural Area or a High Unemployment Area — or designated infrastructure projects. For non-TEA projects, the minimum investment is $1,050,000.',
    ARRAY['$800k', '$800,000', '$1,050,000', 'TEA', 'minimum investment', 'RIA 2022'],
    TRUE
  ),
  (
    'kb-2',
    'Job Creation',
    'How many jobs must an EB-5 investment create?',
    'Each EB-5 investment must create or preserve at least 10 full-time jobs for qualifying U.S. workers for a minimum of two years. In Regional Center projects, these can include indirect and induced jobs modeled through economic methodologies. In direct EB-5 projects, only direct W-2 employees count.',
    ARRAY['10 jobs', 'job creation', 'indirect jobs', 'regional center', 'W-2'],
    TRUE
  ),
  (
    'kb-3',
    'Process & Timeline',
    'Can I file I-526E and apply for a work/travel permit concurrently?',
    'Yes! Under RIA 2022, if you are lawfully present in the United States on another nonimmigrant visa (such as H-1B, L-1, F-1, or O-1), you can file Form I-526E concurrently with Form I-485 (Adjustment of Status) to receive an EAD work authorization and Advance Parole travel document.',
    ARRAY['concurrent filing', 'I-485', 'I-765', 'EAD', 'H-1B', 'work permit'],
    TRUE
  ),
  (
    'kb-4',
    'Process & Timeline',
    'What are the set-aside visa categories and why are they important for Indian and Chinese investors?',
    'RIA 2022 reserved 32% of annual EB-5 visas for priority set-aside categories: 20% for Rural areas, 10% for High Unemployment Areas (HUA), and 2% for Infrastructure projects. Crucially, these categories allow backlogged applicants to bypass long waiting queues.',
    ARRAY['set-aside', 'rural', 'high unemployment', 'india', 'china', 'visa bulletin'],
    TRUE
  ),
  (
    'kb-5',
    'Source of Funds',
    'What documents are required to prove lawful Source of Funds (SOF)?',
    'USCIS requires complete documentation demonstrating that your investment capital was lawfully obtained. Acceptable sources include: employment income/bonuses, business distributions, property sales, gifts, inheritances, or loans secured by personal assets.',
    ARRAY['source of funds', 'SOF', 'lawful capital', 'gift', 'property sale'],
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- ── 11. Automatic updated_at Trigger ──────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_user_profiles_updated BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_sync_jobs_updated BEFORE UPDATE ON spreadsheet_sync_jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_knowledge_base_updated BEFORE UPDATE ON knowledge_base FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 12. Row Level Security & Policies ─────────────────────────
ALTER TABLE user_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records          ENABLE ROW LEVEL SECURITY;
ALTER TABLE spreadsheet_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE spreadsheet_sync_jobs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base           ENABLE ROW LEVEL SECURITY;

-- Helper function: is current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "users_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_see_own_lead" ON leads;
DROP POLICY IF EXISTS "users_insert_own_lead" ON leads;
DROP POLICY IF EXISTS "users_update_own_lead" ON leads;
DROP POLICY IF EXISTS "admin_delete_lead" ON leads;
DROP POLICY IF EXISTS "users_own_conversations" ON conversations;
DROP POLICY IF EXISTS "users_see_own_messages" ON messages;
DROP POLICY IF EXISTS "admin_consent_records" ON consent_records;
DROP POLICY IF EXISTS "admin_spreadsheet_integrations" ON spreadsheet_integrations;
DROP POLICY IF EXISTS "admin_sync_jobs" ON spreadsheet_sync_jobs;
DROP POLICY IF EXISTS "admin_admin_users" ON admin_users;
DROP POLICY IF EXISTS "public_read_knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "admin_manage_knowledge_base" ON knowledge_base;

-- User profiles
CREATE POLICY "users_own_profile" ON user_profiles
  FOR ALL USING (auth_user_id = auth.uid() OR is_admin());

-- Leads
CREATE POLICY "users_see_own_lead" ON leads
  FOR SELECT USING (auth_user_id = auth.uid() OR is_admin() OR auth.uid() IS NULL);

CREATE POLICY "users_insert_own_lead" ON leads
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "users_update_own_lead" ON leads
  FOR UPDATE USING (auth_user_id = auth.uid() OR is_admin());

CREATE POLICY "admin_delete_lead" ON leads
  FOR DELETE USING (is_admin());

-- Conversations
CREATE POLICY "users_own_conversations" ON conversations
  FOR ALL USING (auth_user_id = auth.uid() OR is_admin() OR auth.uid() IS NULL);

-- Messages
CREATE POLICY "users_see_own_messages" ON messages
  FOR ALL USING (TRUE);

-- Consent records
CREATE POLICY "admin_consent_records" ON consent_records
  FOR ALL USING (TRUE);

-- Spreadsheet tables
CREATE POLICY "admin_spreadsheet_integrations" ON spreadsheet_integrations
  FOR ALL USING (TRUE);

CREATE POLICY "admin_sync_jobs" ON spreadsheet_sync_jobs
  FOR ALL USING (TRUE);

CREATE POLICY "admin_admin_users" ON admin_users
  FOR ALL USING (TRUE);

-- Knowledge base (Public read, admin full access)
CREATE POLICY "public_read_knowledge_base" ON knowledge_base
  FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "admin_manage_knowledge_base" ON knowledge_base
  FOR ALL USING (TRUE);
