// ─── Local Conversation Storage & Fallback Manager ─────────────────────────
// Persists every conversation with user details (Name, Email, Phone, Date & Time)
// and ensures immediate visibility in the Admin Dashboard.

import { supabase } from './supabase'

export interface StoredMessage {
  id: string
  conversation_id: string
  sender_type: 'user' | 'assistant' | 'system'
  message_content: string
  created_at: string
}

export interface StoredConversation {
  id: string
  auth_user_id: string | null
  user_name: string | null
  user_email: string | null
  user_phone: string | null
  conversation_title: string
  created_at: string
  updated_at: string
  messages: StoredMessage[]
}

const STORAGE_KEY = 'shoora_stored_conversations'

// Initial seed conversations showing date, time, and full investor names
const INITIAL_DEMO_CONVERSATIONS: StoredConversation[] = [
  {
    id: 'conv-demo-1',
    auth_user_id: null,
    user_name: 'Alexander Wright',
    user_email: 'alexander.wright@investor.com',
    user_phone: '+1 (415) 555-2671',
    conversation_title: 'EB-5 Inquiry - Alexander Wright',
    created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 2.5).toISOString(),
    messages: [
      {
        id: 'msg-1',
        conversation_id: 'conv-demo-1',
        sender_type: 'assistant',
        message_content: 'Welcome to Shoora EB-5! I am your Senior EB-5 Investment Advisor. May I have your full name to address you properly?',
        created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      },
      {
        id: 'msg-2',
        conversation_id: 'conv-demo-1',
        sender_type: 'user',
        message_content: 'Alexander Wright',
        created_at: new Date(Date.now() - 3600 * 1000 * 2.9).toISOString(),
      },
      {
        id: 'msg-3',
        conversation_id: 'conv-demo-1',
        sender_type: 'assistant',
        message_content: 'Pleasure to meet you, Alexander! What is your email address so we can send you relevant EB-5 investment resources and updates?',
        created_at: new Date(Date.now() - 3600 * 1000 * 2.8).toISOString(),
      },
      {
        id: 'msg-4',
        conversation_id: 'conv-demo-1',
        sender_type: 'user',
        message_content: 'alexander.wright@investor.com',
        created_at: new Date(Date.now() - 3600 * 1000 * 2.7).toISOString(),
      },
      {
        id: 'msg-5',
        conversation_id: 'conv-demo-1',
        sender_type: 'assistant',
        message_content: 'Thank you! Could you also share your phone number (optional) if you would like an immigration specialist to contact you directly via WhatsApp or call? Or feel free to type "Skip".',
        created_at: new Date(Date.now() - 3600 * 1000 * 2.6).toISOString(),
      },
      {
        id: 'msg-6',
        conversation_id: 'conv-demo-1',
        sender_type: 'user',
        message_content: '+1 (415) 555-2671',
        created_at: new Date(Date.now() - 3600 * 1000 * 2.55).toISOString(),
      },
      {
        id: 'msg-7',
        conversation_id: 'conv-demo-1',
        sender_type: 'assistant',
        message_content: 'Thank you, Alexander! Your investor profile is registered. What questions can I answer for you regarding the EB-5 program, investment thresholds, or processing timelines?',
        created_at: new Date(Date.now() - 3600 * 1000 * 2.5).toISOString(),
      },
      {
        id: 'msg-8',
        conversation_id: 'conv-demo-1',
        sender_type: 'user',
        message_content: 'What is the minimum investment for the EB-5 program in rural projects?',
        created_at: new Date(Date.now() - 3600 * 1000 * 2.45).toISOString(),
      },
      {
        id: 'msg-9',
        conversation_id: 'conv-demo-1',
        sender_type: 'assistant',
        message_content: 'Under the EB-5 Reform and Integrity Act of 2022 (RIA), the minimum qualifying investment in a Targeted Employment Area (TEA), including rural projects, is $800,000. Rural projects also benefit from priority processing and a 20% visa set-aside quota.',
        created_at: new Date(Date.now() - 3600 * 1000 * 2.4).toISOString(),
      },
    ],
  },
  {
    id: 'conv-demo-2',
    auth_user_id: null,
    user_name: 'Priya Patel',
    user_email: 'priya.patel@consulting.com',
    user_phone: '+1 (408) 555-9012',
    conversation_title: 'Concurrent Filing & H-1B - Priya Patel',
    created_at: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 5.8).toISOString(),
    messages: [
      {
        id: 'msg-201',
        conversation_id: 'conv-demo-2',
        sender_type: 'assistant',
        message_content: 'Welcome to Shoora EB-5! I am your Senior EB-5 Investment Advisor. May I have your full name to address you properly?',
        created_at: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
      },
      {
        id: 'msg-202',
        conversation_id: 'conv-demo-2',
        sender_type: 'user',
        message_content: 'Priya Patel',
        created_at: new Date(Date.now() - 3600 * 1000 * 5.95).toISOString(),
      },
      {
        id: 'msg-203',
        conversation_id: 'conv-demo-2',
        sender_type: 'assistant',
        message_content: 'Pleasure to meet you, Priya! What is your email address so we can send you relevant EB-5 investment resources and updates?',
        created_at: new Date(Date.now() - 3600 * 1000 * 5.9).toISOString(),
      },
      {
        id: 'msg-204',
        conversation_id: 'conv-demo-2',
        sender_type: 'user',
        message_content: 'priya.patel@consulting.com',
        created_at: new Date(Date.now() - 3600 * 1000 * 5.85).toISOString(),
      },
      {
        id: 'msg-205',
        conversation_id: 'conv-demo-2',
        sender_type: 'user',
        message_content: 'Can H-1B holders file concurrently under EB-5?',
        created_at: new Date(Date.now() - 3600 * 1000 * 5.82).toISOString(),
      },
      {
        id: 'msg-206',
        conversation_id: 'conv-demo-2',
        sender_type: 'assistant',
        message_content: 'Yes! Concurrent filing of Form I-526E and Form I-485 is permitted for lawful nonimmigrants in the U.S. This allows you to apply for an Employment Authorization Document (EAD) and Advance Parole travel document while your petition is pending.',
        created_at: new Date(Date.now() - 3600 * 1000 * 5.8).toISOString(),
      },
    ],
  },
]

export function getStoredConversations(): StoredConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
    // Initialize defaults if empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_CONVERSATIONS))
    return INITIAL_DEMO_CONVERSATIONS
  } catch (err) {
    console.warn('Failed to read stored conversations:', err)
    return INITIAL_DEMO_CONVERSATIONS
  }
}

export function saveStoredConversations(convs: StoredConversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs))
    window.dispatchEvent(new Event('shoora_conversation_update'))
  } catch (err) {
    console.error('Failed to save stored conversations:', err)
  }
}

export function createStoredConversation(params: {
  id?: string
  auth_user_id?: string | null
  user_name?: string | null
  user_email?: string | null
  user_phone?: string | null
  conversation_title?: string
}): StoredConversation {
  const current = getStoredConversations()
  const id = params.id || `conv-${Date.now()}`
  const now = new Date().toISOString()

  const newConv: StoredConversation = {
    id,
    auth_user_id: params.auth_user_id ?? null,
    user_name: params.user_name ?? null,
    user_email: params.user_email ?? null,
    user_phone: params.user_phone ?? null,
    conversation_title: params.conversation_title || (params.user_name ? `EB-5 Inquiry - ${params.user_name}` : 'EB-5 Inquiry'),
    created_at: now,
    updated_at: now,
    messages: [],
  }

  const updated = [newConv, ...current.filter(c => c.id !== id)]
  saveStoredConversations(updated)

  // Try saving to Supabase if available
  supabase
    .from('conversations')
    .insert({
      id: newConv.id,
      auth_user_id: newConv.auth_user_id,
      conversation_title: newConv.conversation_title,
    })
    .then(undefined, () => {})

  return newConv
}

export function updateStoredConversationUserInfo(
  id: string,
  info: { user_name?: string | null; user_email?: string | null; user_phone?: string | null }
): void {
  const current = getStoredConversations()
  const idx = current.findIndex(c => c.id === id)
  if (idx === -1) return

  const conv = current[idx]
  if (info.user_name !== undefined) conv.user_name = info.user_name
  if (info.user_email !== undefined) conv.user_email = info.user_email
  if (info.user_phone !== undefined) conv.user_phone = info.user_phone

  if (conv.user_name && (!conv.conversation_title || conv.conversation_title === 'EB-5 Inquiry')) {
    conv.conversation_title = `EB-5 Inquiry - ${conv.user_name}`
  }

  conv.updated_at = new Date().toISOString()
  current[idx] = conv
  saveStoredConversations(current)

  supabase
    .from('conversations')
    .update({
      conversation_title: conv.conversation_title,
      updated_at: conv.updated_at,
    })
    .eq('id', id)
    .then(undefined, () => {})
}

export function appendStoredMessage(
  conversationId: string,
  msg: {
    id?: string
    sender_type: 'user' | 'assistant' | 'system'
    message_content: string
    created_at?: string
  }
): void {
  const current = getStoredConversations()
  let conv = current.find(c => c.id === conversationId)

  if (!conv) {
    conv = createStoredConversation({ id: conversationId })
  }

  const fullMsg: StoredMessage = {
    id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conversation_id: conversationId,
    sender_type: msg.sender_type,
    message_content: msg.message_content,
    created_at: msg.created_at || new Date().toISOString(),
  }

  // Avoid duplicate messages
  if (!conv.messages.some(m => m.id === fullMsg.id)) {
    conv.messages.push(fullMsg)
    conv.updated_at = fullMsg.created_at
    saveStoredConversations([...current])

    supabase
      .from('messages')
      .insert({
        id: fullMsg.id,
        conversation_id: conversationId,
        sender_type: fullMsg.sender_type,
        message_content: fullMsg.message_content,
      })
      .then(undefined, () => {})
  }
}

export function deleteStoredConversation(id: string): void {
  const current = getStoredConversations()
  const filtered = current.filter(c => c.id !== id)
  saveStoredConversations(filtered)

  supabase.from('conversations').delete().eq('id', id).then(undefined, () => {})
}
