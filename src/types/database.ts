// ─── Supabase Database Types ──────────────────────────────────────────────────
// Generated manually; regenerate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID
// after running migrations.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Partial<UserProfile>
        Update: Partial<UserProfile>
        Relationships: []
      }
      leads: {
        Row: Lead
        Insert: Partial<Lead>
        Update: Partial<Lead>
        Relationships: []
      }
      conversations: {
        Row: Conversation
        Insert: Partial<Conversation>
        Update: Partial<Conversation>
        Relationships: []
      }
      messages: {
        Row: Message
        Insert: Partial<Message>
        Update: Partial<Message>
        Relationships: []
      }
      consent_records: {
        Row: ConsentRecord
        Insert: Partial<ConsentRecord>
        Update: Partial<ConsentRecord>
        Relationships: []
      }
      spreadsheet_integrations: {
        Row: SpreadsheetIntegration
        Insert: Partial<SpreadsheetIntegration>
        Update: Partial<SpreadsheetIntegration>
        Relationships: []
      }
      spreadsheet_sync_jobs: {
        Row: SpreadsheetSyncJob
        Insert: Partial<SpreadsheetSyncJob>
        Update: Partial<SpreadsheetSyncJob>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

// ─── Model types ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  auth_user_id: string
  full_name: string | null
  verified_email: string | null
  verified_phone: string | null
  country_of_residence: string | null
  preferred_contact_method: 'email' | 'phone' | 'either' | null
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  auth_user_id: string | null
  full_name: string | null
  verified_email: string | null
  verified_phone: string | null
  country_of_residence: string | null
  preferred_contact_method: string | null
  interest_category: string | null
  investment_timeframe: string | null
  optional_budget_range: string | null
  investment_capacity?: string | null
  source_of_funds?: string | null
  current_visa_status?: string | null
  lead_status: LeadStatus
  engagement_score: number
  consultation_requested: boolean
  consultation_date?: string | null
  consultation_time?: string | null
  consultation_mode?: string | null
  consultation_topic?: string | null
  booking_id?: string | null
  follow_up_consent: boolean
  marketing_email_consent: boolean
  marketing_sms_consent: boolean
  lead_source: string | null
  assigned_advisor: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  last_interaction_at: string | null
}

export type LeadStatus =
  | 'new_inquiry'
  | 'interested'
  | 'consultation_requested'
  | 'follow_up_required'
  | 'qualified_by_advisor'
  | 'contacted'
  | 'closed'

export interface Conversation {
  id: string
  auth_user_id: string | null
  lead_id: string | null
  conversation_title: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_type: 'user' | 'assistant' | 'system'
  message_content: string
  created_at: string
}

export interface ConsentRecord {
  id: string
  lead_id: string
  consent_type: 'follow_up' | 'marketing_email' | 'marketing_sms' | 'data_processing'
  consent_status: boolean
  consent_text_version: string
  recorded_at: string
  withdrawal_at: string | null
}

export interface SpreadsheetIntegration {
  id: string
  provider: 'excel' | 'google_sheets'
  enabled: boolean
  configuration_status: 'not_configured' | 'configured' | 'error'
  target_spreadsheet_id: string | null
  target_sheet_name: string | null
  last_success_at: string | null
  last_error_at: string | null
  last_error_message: string | null
}

export type SyncStatus = 'pending' | 'processing' | 'synced' | 'retry_scheduled' | 'failed' | 'disabled'

export interface SpreadsheetSyncJob {
  id: string
  lead_id: string
  provider: 'excel' | 'google_sheets'
  operation_type: 'insert' | 'update'
  sync_status: SyncStatus
  attempt_count: number
  last_attempt_at: string | null
  next_attempt_at: string | null
  external_row_identifier: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

// ─── App-level types ──────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  timestamp: Date
}

export interface CollectedUserData {
  fullName?: string
  name?: string
  email?: string
  phone?: string
  country?: string
  preferredContact?: string
  researchingFor?: string
  stage?: string
  timeframe?: string
  wantsContact?: boolean
  consultationRequested?: boolean
}

export type AuthMethod = 'email' | 'phone'
export type AuthStep = 'method' | 'enter_details' | 'verify_otp' | 'complete'

export interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'advisor'
}
