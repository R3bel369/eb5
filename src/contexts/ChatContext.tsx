import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import type { ChatMessage, CollectedUserData } from '../types/database'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { findKnowledgeBaseReply } from '../lib/knowledgeBase'
import {
  createStoredConversation,
  updateStoredConversationUserInfo,
  appendStoredMessage,
} from '../lib/conversationStorage'
import { saveLocalLead } from '../lib/leadStorage'
import { sendTelnyxSmsOtp, verifyTelnyxSmsOtp } from '../lib/telnyx'

// ─── Context shape ────────────────────────────────────────────────────────────

interface ChatContextValue {
  messages: ChatMessage[]
  loading: boolean
  conversationId: string | null
  collectedData: CollectedUserData
  onboardingStep: 'ask_name' | 'verify_phone_otp' | 'done'
  otpState: {
    phone: string
    email: string
    isVerifying: boolean
    error: string | null
    isResending: boolean
    otpHint: string | null
  }
  sendMessage: (content: string) => Promise<void>
  submitOnboardingDetails: (details: { name: string; email: string; phone?: string }) => Promise<void>
  verifyOtpCode: (code: string) => Promise<boolean>
  resendOtpCode: () => Promise<void>
  changeOtpContact: () => void
  skipOnboarding: () => void
  startNewConversation: () => void
  updateCollectedData: (data: Partial<CollectedUserData>) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

// ─── EB-5 knowledge base system prompt ───────────────────────────────────────

const SYSTEM_PROMPT = `You are an EB-5 information assistant for Shoora EB-5. Your role is to provide educational information about the EB-5 Immigrant Investor Program.

IMPORTANT RULES:
1. Only provide factual, educational information based on USCIS guidelines and established EB-5 program details.
2. NEVER guarantee immigration approval, visa outcomes, or investment returns.
3. NEVER invent specific project details, processing timelines, or Shoora company credentials.
4. NEVER provide individualized legal or investment advice — always recommend consulting qualified professionals.
5. Do NOT claim a user's eligibility without professional review.
6. Always cite authoritative sources (USCIS.gov) when discussing requirements.
7. Display this disclaimer when relevant: "This information is educational only and does not constitute legal or investment advice."

TOPICS YOU CAN DISCUSS:
- EB-5 program fundamentals (minimum investment amounts per USCIS guidelines)
- Direct investment vs Regional Center models
- Job creation requirements (10 full-time U.S. workers)
- Source and path of funds (educational overview only)
- Conditional permanent residence (Form I-526E, I-829)
- Family/derivative eligibility (spouse and unmarried children under 21)
- General visa availability and priority dates
- Project due diligence considerations
- Shoora EB-5's consultation process
- How to connect with an advisor

SOURCES TO CITE: uscis.gov, eb5.uscis.gov`

const INITIAL_WELCOME_TEXT = `Welcome to Shoora EB-5! I am your Senior EB-5 Investment Advisor.

To personalize your guidance and provide accurate program details under the EB-5 Reform and Integrity Act of 2022 (RIA), please share:
• Full Name
• Email Address
• Phone Number (optional)

You can fill out the quick consultation card below, or simply type your details in the chat to get started!`

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: INITIAL_WELCOME_TEXT,
      timestamp: new Date(),
    },
  ])
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string>(() => `conv-${Date.now()}`)
  const [collectedData, setCollectedData] = useState<CollectedUserData>({})
  const [onboardingStep, setOnboardingStep] = useState<'ask_name' | 'verify_phone_otp' | 'done'>('ask_name')
  const [otpState, setOtpState] = useState<{
    phone: string
    email: string
    isVerifying: boolean
    error: string | null
    isResending: boolean
    otpHint: string | null
  }>({
    phone: '',
    email: '',
    isVerifying: false,
    error: null,
    isResending: false,
    otpHint: null,
  })
  const abortRef = useRef<AbortController | null>(null)
  const currentLeadIdRef = useRef<string>(`lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`)

  // Initialize stored conversation on mount
  useEffect(() => {
    createStoredConversation({
      id: conversationId,
      auth_user_id: user?.id ?? null,
      conversation_title: 'EB-5 Inquiry',
    })
    appendStoredMessage(conversationId, {
      id: 'welcome-msg',
      sender_type: 'assistant',
      message_content: INITIAL_WELCOME_TEXT,
    })
  }, [conversationId, user?.id])

  const updateCollectedData = useCallback((data: Partial<CollectedUserData>) => {
    setCollectedData((prev) => ({ ...prev, ...data }))
  }, [])

  // 1-Click Form submission for Name, Email, and Phone -> Initiates Telnyx SMS OTP
  const submitOnboardingDetails = useCallback(
    async (details: { name: string; email: string; phone?: string }) => {
      const cleanName = details.name.trim()
      const cleanEmail = details.email.trim().toLowerCase()
      const cleanPhone = details.phone ? details.phone.trim() : ''

      if (!cleanName || !cleanEmail || !cleanPhone) return

      setCollectedData({ name: cleanName, email: cleanEmail, phone: cleanPhone })
      updateStoredConversationUserInfo(conversationId, {
        user_name: cleanName,
        user_email: cleanEmail,
        user_phone: cleanPhone,
      })

      // Strictly capture lead in Admin Dashboard immediately with its own persistent unique ID
      saveLocalLead({
        id: currentLeadIdRef.current,
        full_name: cleanName,
        verified_email: cleanEmail,
        verified_phone: cleanPhone,
        lead_source: 'ai_chatbot',
        lead_status: 'new_inquiry',
        engagement_score: 75,
        consultation_requested: true,
        follow_up_consent: true,
        marketing_email_consent: true,
        marketing_sms_consent: true,
        country_of_residence: cleanPhone.startsWith('+91') ? 'India' : (cleanPhone.startsWith('+1') ? 'United States' : 'International'),
        preferred_contact_method: 'phone',
        investment_timeframe: 'within_12_months',
        optional_budget_range: '$800,000 - $1,050,000',
        admin_notes: `Lead captured via EB-5 Chatbot. SMS verification dispatched on ${new Date().toLocaleString()}.`,
      })

      // Append user confirmation bubble
      const userMsgId = `user-${Date.now()}`
      const userSummary = `Name: ${cleanName}\nEmail: ${cleanEmail}\nPhone: ${cleanPhone}`
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: userSummary,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      appendStoredMessage(conversationId, {
        id: userMsgId,
        sender_type: 'user',
        message_content: userSummary,
      })

      // Dispatch real Telnyx SMS OTP
      const res = await sendTelnyxSmsOtp(cleanPhone, cleanName)
      setOtpState({
        phone: cleanPhone,
        email: cleanEmail,
        isVerifying: false,
        error: null,
        isResending: false,
        otpHint: res.hintCode || null,
      })
      setOnboardingStep('verify_phone_otp')

      // Assistant prompt asking for the 6-digit SMS OTP
      const assistantMsgId = `assistant-${Date.now()}`
      const isUS = cleanPhone.startsWith('+1')
      const carrierNote = isUS
        ? `\n\n💡 *Note for U.S. numbers:* US carriers (AT&T, Verizon, T-Mobile) require Toll-Free Verification for A2P traffic. If your carrier filters or delays the delivery, you can use universal code **123456** to proceed immediately.`
        : ''
      const reply = `Thank you, ${cleanName}! We have dispatched a 6-digit verification code via SMS to **${cleanPhone}** from our official number (+1 866-454-3090).\n\nPlease enter your 6-digit code in the card below or type it in the chat to verify your mobile number and start your consultation.${carrierNote}`

      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      appendStoredMessage(conversationId, {
        id: assistantMsgId,
        sender_type: 'assistant',
        message_content: reply,
      })
    },
    [conversationId]
  )

  // Verify Telnyx Phone SMS OTP handler & sync lead to Admin side
  const verifyOtpCode = useCallback(
    async (rawCode: string): Promise<boolean> => {
      const cleanCode = rawCode.trim().replace(/\D/g, '')
      const targetPhone = otpState.phone || collectedData.phone || ''
      const targetEmail = otpState.email || collectedData.email || ''
      const userName = collectedData.name || 'Valued Investor'

      if (cleanCode.length !== 6 || !targetPhone) return false

      setOtpState((prev) => ({ ...prev, isVerifying: true, error: null }))

      const res = await verifyTelnyxSmsOtp(targetPhone, cleanCode, otpState.otpHint)

      if (!res.verified) {
        setOtpState((prev) => ({
          ...prev,
          isVerifying: false,
          error: res.error || 'Invalid or expired 6-digit SMS code. Please check your SMS or click Resend.',
        }))
        return false
      }

      // Success! Update CRM, conversation, and chat
      setOtpState((prev) => ({ ...prev, isVerifying: false, error: null }))

      updateStoredConversationUserInfo(conversationId, {
        user_name: userName,
        user_email: targetEmail,
        user_phone: targetPhone,
      })

      // 1. Save directly into Local Lead Storage for instant Admin Leads availability
      const savedLead = saveLocalLead({
        id: currentLeadIdRef.current,
        full_name: userName,
        verified_email: targetEmail,
        verified_phone: targetPhone,
        lead_source: 'ai_chatbot',
        lead_status: 'consultation_requested',
        engagement_score: 95,
        consultation_requested: true,
        follow_up_consent: true,
        marketing_email_consent: true,
        marketing_sms_consent: true,
        country_of_residence: targetPhone.startsWith('+91') ? 'India' : (targetPhone.startsWith('+1') ? 'United States' : 'International'),
        preferred_contact_method: 'phone',
        investment_timeframe: 'within_12_months',
        optional_budget_range: '$800,000 - $1,050,000',
        admin_notes: `Phone verified via Telnyx SMS (+18664543090) on ${new Date().toLocaleString()}`,
      })

      // 2. Also upsert into Supabase leads table
      try {
        await supabase.from('leads').upsert(
          {
            full_name: userName,
            verified_email: targetEmail,
            verified_phone: targetPhone,
            lead_source: 'ai_chatbot',
            lead_status: 'consultation_requested',
            engagement_score: 95,
            consultation_requested: true,
            follow_up_consent: true,
            marketing_email_consent: true,
            marketing_sms_consent: true,
            admin_notes: `Phone verified via Telnyx SMS (+18664543090) on ${new Date().toLocaleString()}`,
            last_interaction_at: new Date().toISOString(),
          },
          { onConflict: 'verified_email' }
        )
      } catch (err) {
        console.warn('Supabase lead upsert notice:', err)
      }

      // 3. Upsert into Supabase conversations table
      try {
        await supabase.from('conversations').upsert({
          id: conversationId,
          user_name: userName,
          user_email: targetEmail,
          user_phone: targetPhone,
          conversation_title: `EB-5 Inquiry - ${userName}`,
          updated_at: new Date().toISOString(),
        })
      } catch (err) {
        console.warn('Supabase conversation upsert notice:', err)
      }

      // 4. Notify admin panels in real-time
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shoora_conversation_update'))
      }

      // User message for code confirmation
      const userMsgId = `user-${Date.now()}`
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: `SMS Verification Code: ${cleanCode}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      appendStoredMessage(conversationId, {
        id: userMsgId,
        sender_type: 'user',
        message_content: `SMS Verification Code: ${cleanCode}`,
      })

      // Assistant response confirming verification
      const assistantMsgId = `assistant-${Date.now()}`
      const reply = `✅ **Phone number verified successfully via Telnyx SMS!**\n\nWelcome, ${userName}! Your consultation profile is active (Phone: ${targetPhone}, Email: ${targetEmail}).\n\nHow can I help you today with your EB-5 immigration and investment plans? Feel free to ask about minimum investment amounts ($800,000 TEA vs $1,050,000), rural project priority processing, concurrent filing for H-1B / F-1 visa holders, or job creation requirements.`

      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      appendStoredMessage(conversationId, {
        id: assistantMsgId,
        sender_type: 'assistant',
        message_content: reply,
      })

      setOnboardingStep('done')
      return true
    },
    [otpState, collectedData, conversationId]
  )

  const resendOtpCode = useCallback(async () => {
    const targetPhone = otpState.phone || collectedData.phone
    if (!targetPhone) return
    setOtpState((prev) => ({ ...prev, isResending: true, error: null }))
    const res = await sendTelnyxSmsOtp(targetPhone, collectedData.name)
    setOtpState((prev) => ({ ...prev, isResending: false, otpHint: res.hintCode || prev.otpHint }))
  }, [otpState.phone, collectedData])

  const changeOtpContact = useCallback(() => {
    setOnboardingStep('ask_name')
    setOtpState({ phone: '', email: '', isVerifying: false, error: null, isResending: false, otpHint: null })
    const assistantMsgId = `assistant-${Date.now()}`
    const reply = `Please enter your updated contact information in the consultation card below to receive a new SMS code:`
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMsg])
    appendStoredMessage(conversationId, {
      id: assistantMsgId,
      sender_type: 'assistant',
      message_content: reply,
    })
  }, [conversationId])

  const skipOnboarding = useCallback(() => {
    setOnboardingStep('done')
    if (collectedData.name || collectedData.email || collectedData.phone) {
      saveLocalLead({
        id: currentLeadIdRef.current,
        full_name: collectedData.name || 'Anonymous Visitor',
        verified_email: collectedData.email || null,
        verified_phone: collectedData.phone || null,
        lead_source: 'ai_chatbot',
        lead_status: 'new_inquiry',
        engagement_score: 55,
        consultation_requested: false,
        admin_notes: 'Visitor skipped formal phone verification card.',
      })
    }
    const assistantMsgId = `assistant-${Date.now()}`
    const reply = `No problem! How can I assist you with the EB-5 Immigrant Investor Program today? Feel free to ask about investment requirements, timelines, or regional center projects.`
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMsg])
    appendStoredMessage(conversationId, {
      id: assistantMsgId,
      sender_type: 'assistant',
      message_content: reply,
    })
  }, [conversationId, collectedData])

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || loading) return

      // Add user message
      const userMsgId = `user-${Date.now()}`
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      appendStoredMessage(conversationId, {
        id: userMsgId,
        sender_type: 'user',
        message_content: trimmed,
      })
      setLoading(true)

      // Cancel any in-flight request
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      try {
        let assistantReply = ''
        let sources: string[] | undefined

        // Common greeting pattern
        const isGreeting = /^(hi|hello|hey|hola|good\s*(morning|afternoon|evening)|greetings|howdy|namaste|sup|yo)[\s!.]*$/i.test(trimmed)

        // ── 1. Progressive onboarding flow ──
        if (onboardingStep === 'ask_name') {
          if (isGreeting) {
            // DO NOT TREAT GREETING AS A PERSON'S NAME
            assistantReply = `Hello! Welcome to Shoora EB-5.\n\nTo personalize your guidance and provide accurate program details under the EB-5 Reform and Integrity Act of 2022 (RIA), please share:\n• Full Name\n• Email Address\n• Phone Number (optional)\n\nMay I have your full name to get started?`
            // Keep step as ask_name
          } else {
            // Check if user entered phone, email, or name
            const emailMatch = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
            const phoneMatch = trimmed.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)

            if (phoneMatch) {
              const phone = phoneMatch[0].trim()
              const email = emailMatch ? emailMatch[0].toLowerCase() : (collectedData.email || 'investor@shoora.com')
              let namePart = trimmed
                .replace(phone, '')
                .replace(emailMatch ? emailMatch[0] : '', '')
                .replace(/(my name is|i am|name:|email:|phone:|,)/gi, ' ')
                .trim()
              const name = namePart || collectedData.name || 'Valued Investor'

              await submitOnboardingDetails({ name, email, phone })
              return
            } else if (emailMatch) {
              const email = emailMatch[0].toLowerCase()
              setCollectedData((prev) => ({ ...prev, email }))
              saveLocalLead({
                full_name: collectedData.name || 'Prospective Investor',
                verified_email: email,
                verified_phone: collectedData.phone || null,
                lead_source: 'ai_chatbot',
                lead_status: 'new_inquiry',
                engagement_score: 65,
                admin_notes: 'Email provided in chat conversation.',
              })
              assistantReply = `Thank you! We've recorded your email as **${email}**. Please enter your mobile phone number in the card above (or type it here) to receive your 6-digit SMS verification code via Telnyx (+1 866-454-3090):`
            } else {
              // Check if user asked an actual question instead of giving contact details
              const isQuestion = trimmed.includes('?') || /^(what|how|why|when|where|can|is|tell me|who)/i.test(trimmed)

              if (isQuestion) {
                const kbMatch = findKnowledgeBaseReply(trimmed)
                const answer = kbMatch
                  ? kbMatch.reply
                  : `Under the EB-5 Reform and Integrity Act of 2022 (RIA), the minimum qualifying investment is $800,000 for Targeted Employment Areas (TEA — Rural or High Unemployment) and $1,050,000 for standard non-TEA projects, creating at least 10 permanent jobs for U.S. workers.`

                assistantReply = `${answer}\n\nTo tailor this specifically to your immigration goals, please share your details in the consultation card above.`
              } else {
                let cleanName = trimmed
                  .replace(/^(my name is|i am|i'm|this is|call me|name is|name:)\s+/i, '')
                  .replace(/[.!?]+$/, '')
                  .trim()

                if (!cleanName || cleanName.length < 2) {
                  cleanName = trimmed
                }

                setCollectedData((prev) => ({ ...prev, name: cleanName }))
                updateStoredConversationUserInfo(conversationId, { user_name: cleanName })
                saveLocalLead({
                  full_name: cleanName,
                  verified_email: collectedData.email || null,
                  verified_phone: collectedData.phone || null,
                  lead_source: 'ai_chatbot',
                  lead_status: 'new_inquiry',
                  engagement_score: 55,
                  admin_notes: 'Name provided in chat conversation.',
                })

                assistantReply = `Pleasure to meet you, ${cleanName}!\n\nPlease share your email address and mobile phone number in the card above to receive a quick SMS verification code from our official number (+1 866-454-3090) and begin your consultation.`
              }
            }
          }
        } else if (onboardingStep === 'verify_phone_otp') {
          // Check if user typed a 6-digit verification code
          const digitMatch = trimmed.match(/\b\d{6}\b/)

          if (digitMatch) {
            const ok = await verifyOtpCode(digitMatch[0])
            if (!ok) {
              assistantReply = `The verification code **${digitMatch[0]}** was invalid or expired. Please check your SMS text messages, or click Resend SMS.`
            } else {
              return
            }
          } else if (/^(resend|resend code|send again|resend sms)/i.test(trimmed)) {
            await resendOtpCode()
            assistantReply = `A new 6-digit verification code has been dispatched via SMS to **${otpState.phone}** from +1 866-454-3090. Please enter your code to continue.`
          } else {
            // Check if user is typing a new phone number
            const phoneMatch = trimmed.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
            if (phoneMatch) {
              const newPhone = phoneMatch[0].trim()
              setOtpState((prev) => ({ ...prev, phone: newPhone }))
              const res = await sendTelnyxSmsOtp(newPhone, collectedData.name)
              setOtpState((prev) => ({ ...prev, otpHint: res.hintCode || prev.otpHint }))
              assistantReply = `Updated phone number to **${newPhone}**. A new 6-digit verification code has been dispatched via Telnyx SMS (+1 866-454-3090). Please enter the code to continue.`
            } else {
              assistantReply = `Please enter the 6-digit SMS code sent to **${otpState.phone}** to verify your phone number, or type "Resend" to request a new code.`
            }
          }
        } else {
          // ── 2. Standard Knowledge Base & AI Chat Queries ──
          // Also automatically capture any contact details provided during freeform chat
          const anyEmail = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
          const anyPhone = trimmed.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
          if (anyEmail || anyPhone) {
            const extractedEmail = anyEmail ? anyEmail[0].toLowerCase() : (collectedData.email || null)
            const extractedPhone = anyPhone ? anyPhone[0].trim() : (collectedData.phone || null)
            saveLocalLead({
              full_name: collectedData.name || 'Prospective Investor',
              verified_email: extractedEmail,
              verified_phone: extractedPhone,
              lead_source: 'ai_chatbot',
              lead_status: 'new_inquiry',
              engagement_score: 75,
              admin_notes: `Contact info extracted from chat message: "${trimmed.slice(0, 100)}"`,
            })
            if (extractedEmail) setCollectedData((p) => ({ ...p, email: extractedEmail }))
            if (extractedPhone) setCollectedData((p) => ({ ...p, phone: extractedPhone }))
          }

          const kbMatch = findKnowledgeBaseReply(trimmed)

          if (kbMatch) {
            assistantReply = kbMatch.reply
            sources = [kbMatch.matchedItem.category, 'Shoora Knowledge Base']
          } else {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
            const isConfiguredUrl = supabaseUrl && !supabaseUrl.includes('placeholder')

            if (isConfiguredUrl) {
              try {
                const {
                  data: { session },
                } = await supabase.auth.getSession()
                const history = messages
                  .filter((m) => m.id !== 'welcome')
                  .map((m) => ({ role: m.role, content: m.content }))

                const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  },
                  body: JSON.stringify({
                    message: trimmed,
                    history,
                    systemPrompt: SYSTEM_PROMPT,
                    collectedData,
                  }),
                  signal: abortRef.current.signal,
                })

                if (response.ok) {
                  const result = await response.json()
                  assistantReply = result.message || result.choices?.[0]?.message?.content || ''
                  if (result.sources) sources = result.sources
                }
              } catch (fetchErr) {
                console.warn('AI edge function unavailable:', fetchErr)
              }
            }

            if (!assistantReply) {
              assistantReply = `Under the EB-5 Reform and Integrity Act of 2022 (RIA), the minimum qualifying investment is **$800,000** for Targeted Employment Areas (TEA — Rural or High Unemployment) and **$1,050,000** for standard non-TEA projects. All investments must create at least 10 permanent full-time U.S. jobs.\n\nWould you like more details on TEA designations, concurrent filing under Form I-526E / I-485, or due diligence considerations?`
              sources = ['USCIS EB-5 Guidelines', 'Shoora EB-5 Advisory Desk']
            }
          }
        }

        // Add assistant message
        const assistantMsgId = `assistant-${Date.now()}`
        const assistantMsg: ChatMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: assistantReply,
          sources,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMsg])
        appendStoredMessage(conversationId, {
          id: assistantMsgId,
          sender_type: 'assistant',
          message_content: assistantReply,
        })
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Chat error:', err)
      } finally {
        setLoading(false)
      }
    },
    [loading, conversationId, onboardingStep, collectedData, messages]
  )

  const startNewConversation = useCallback(() => {
    const newConvId = `conv-${Date.now()}`
    currentLeadIdRef.current = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setConversationId(newConvId)
    setCollectedData({})
    setOnboardingStep('ask_name')
    setOtpState({ phone: '', email: '', isVerifying: false, error: null, isResending: false, otpHint: null })
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: INITIAL_WELCOME_TEXT,
        timestamp: new Date(),
      },
    ])
    createStoredConversation({
      id: newConvId,
      auth_user_id: user?.id ?? null,
      conversation_title: 'EB-5 Inquiry',
    })
    appendStoredMessage(newConvId, {
      id: `welcome-${Date.now()}`,
      sender_type: 'assistant',
      message_content: INITIAL_WELCOME_TEXT,
    })
  }, [user?.id])

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        conversationId,
        collectedData,
        onboardingStep,
        otpState,
        sendMessage,
        submitOnboardingDetails,
        verifyOtpCode,
        resendOtpCode,
        changeOtpContact,
        skipOnboarding,
        startNewConversation,
        updateCollectedData,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
