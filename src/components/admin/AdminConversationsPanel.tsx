import { useEffect, useState } from 'react'
import {
  getStoredConversations,
  deleteStoredConversation,
  type StoredConversation,
} from '../../lib/conversationStorage'
import { formatDateTime } from '../../lib/utils'
import { Avatar } from '../common/Avatar'
import {
  MessageSquare,
  Search,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Trash2,
  ChevronRight,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export function AdminConversationsPanel() {
  const [conversations, setConversations] = useState<StoredConversation[]>([])
  const [selected, setSelected] = useState<StoredConversation | null>(null)
  const [search, setSearch] = useState('')

  const loadConversations = () => {
    const list = getStoredConversations()
    setConversations(list)
    if (selected) {
      const updated = list.find((c) => c.id === selected.id)
      if (updated) setSelected(updated)
    }
  }

  useEffect(() => {
    loadConversations()
    window.addEventListener('shoora_conversation_update', loadConversations)
    return () => window.removeEventListener('shoora_conversation_update', loadConversations)
  }, [selected?.id])

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this conversation record?')) {
      deleteStoredConversation(id)
      if (selected?.id === id) setSelected(null)
      loadConversations()
      toast.success('Conversation removed.')
    }
  }

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      (c.user_name && c.user_name.toLowerCase().includes(q)) ||
      (c.user_email && c.user_email.toLowerCase().includes(q)) ||
      (c.user_phone && c.user_phone.toLowerCase().includes(q)) ||
      (c.conversation_title && c.conversation_title.toLowerCase().includes(q)) ||
      c.messages.some((m) => m.message_content.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-navy-900">Conversations & Transcripts</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-100 text-gold-800">
              {conversations.length} Total
            </span>
          </div>
          <p className="text-xs text-navy-500 mt-1">
            Real-time chat transcripts captured from the AI chatbot, complete with inquirer names, contact details, date and time.
          </p>
        </div>

        <Link
          to="/conversation"
          target="_blank"
          className="btn-secondary text-xs py-2 px-3.5 shadow-sm inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open Live Chat Client
        </Link>
      </div>

      {/* Main split view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Conversation List */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="search"
              placeholder="Search by name, email, phone, or message…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 text-xs py-2.5 bg-white shadow-2xs"
            />
          </div>

          <div className="card p-0 overflow-hidden divide-y divide-gray-100 max-h-[calc(100vh-14rem)] overflow-y-auto shadow-xs">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-navy-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No conversations match your search.
              </div>
            ) : (
              filtered.map((conv) => {
                const isSelected = selected?.id === conv.id
                const lastMsg = conv.messages[conv.messages.length - 1]
                const displayName = conv.user_name || 'Anonymous Inquirer'

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelected(conv)}
                    className={`p-4 cursor-pointer transition-all text-left flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-gold-50/60 border-l-4 border-gold-500'
                        : 'hover:bg-gray-50 bg-white'
                    }`}
                  >
                    {/* Monogram avatar */}
                    <div className="w-10 h-10 rounded-full bg-navy-900 text-gold-400 font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-2xs">
                      {displayName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-bold text-navy-900 truncate">
                          {displayName}
                        </p>
                        <button
                          onClick={(e) => handleDelete(e, conv.id)}
                          title="Delete conversation"
                          className="text-gray-300 hover:text-red-600 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Contact badges */}
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-navy-500">
                        {conv.user_email && (
                          <span className="inline-flex items-center gap-1 text-navy-600">
                            <Mail className="w-3 h-3 text-gold-600" />
                            {conv.user_email}
                          </span>
                        )}
                        {conv.user_phone && (
                          <span className="inline-flex items-center gap-1 text-navy-600">
                            <Phone className="w-3 h-3 text-gold-600" />
                            {conv.user_phone}
                          </span>
                        )}
                      </div>

                      {/* Last message preview */}
                      {lastMsg && (
                        <p className="text-xs text-navy-400 truncate line-clamp-1 italic">
                          "{lastMsg.message_content}"
                        </p>
                      )}

                      {/* Date, Time & Message Count */}
                      <div className="flex items-center justify-between pt-1 text-[10px] text-navy-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-navy-400" />
                          {formatDateTime(conv.created_at)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-navy-600 font-semibold">
                          {conv.messages.length} msg{conv.messages.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right column: Selected Conversation Detail */}
        <div className="lg:col-span-7">
          {selected ? (
            <div className="card p-0 overflow-hidden shadow-xs border border-navy-100">
              {/* Header */}
              <div className="p-4 bg-white border-b border-gray-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-navy-900 text-base">
                      {selected.user_name || 'Anonymous Inquirer'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-100 text-gold-800">
                      EB-5 Inquiry
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-navy-500 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-navy-400" />
                      {formatDateTime(selected.created_at)}
                    </span>
                    {selected.user_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-navy-400" />
                        <a href={`mailto:${selected.user_email}`} className="text-navy-700 hover:underline">
                          {selected.user_email}
                        </a>
                      </span>
                    )}
                    {selected.user_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-navy-400" />
                        <a href={`tel:${selected.user_phone}`} className="text-navy-700 hover:underline">
                          {selected.user_phone}
                        </a>
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-navy-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message transcript */}
              <div className="p-4 sm:p-6 bg-ivory-50/40 space-y-4 max-h-[550px] overflow-y-auto">
                {selected.messages.map((m) => {
                  const isUser = m.sender_type === 'user'

                  return (
                    <div
                      key={m.id}
                      className={`flex gap-3 items-start ${
                        isUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <Avatar role={isUser ? 'user' : 'assistant'} size="sm" />

                      <div
                        className={`flex flex-col gap-1 max-w-[80%] ${
                          isUser ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-navy-400 font-medium">
                          <span>{isUser ? selected.user_name || 'Investor' : 'AI Advisor'}</span>
                          <span>•</span>
                          <span>{formatDateTime(m.created_at)}</span>
                        </div>

                        <div
                          className={`text-xs px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-2xs ${
                            isUser
                              ? 'bg-navy-900 text-white rounded-tr-xs'
                              : 'bg-white text-navy-900 border border-gray-200/80 rounded-tl-xs'
                          }`}
                        >
                          {m.message_content}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer info */}
              <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-navy-400">
                <span>Session ID: {selected.id}</span>
                <span>Last active: {formatDateTime(selected.updated_at)}</span>
              </div>
            </div>
          ) : (
            <div className="card py-16 text-center text-navy-400 border border-dashed border-gray-300">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30 text-navy-500" />
              <p className="font-semibold text-navy-700 text-sm">Select a Conversation</p>
              <p className="text-xs text-navy-400 mt-1 max-w-sm mx-auto">
                Click any conversation from the list to inspect the complete transcript, inquirer details, date, and time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
