import { useState } from 'react'
import { Sparkles, ChevronRight, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

export interface QuestionInsight {
  id: string
  label: string
  question: string
  category: string
  icon: string
}

export const QUESTION_INSIGHTS: QuestionInsight[] = [
  {
    id: 'min-inv',
    label: '$800K vs $1.05M',
    question: 'What is the minimum qualifying investment for TEA vs non-TEA under the RIA 2022?',
    category: 'Investment',
    icon: '💰',
  },
  {
    id: 'rural-tea',
    label: 'Rural Priority',
    question: 'How does Rural TEA priority processing work and what are the set-aside visas?',
    category: 'Set-Aside',
    icon: '🏔️',
  },
  {
    id: 'concurrent-filing',
    label: 'H-1B / F-1 Concurrent Filing',
    question: 'Can H-1B, L-1, or F-1 visa holders file Form I-485 concurrently in the U.S.?',
    category: 'Visas',
    icon: '⚡',
  },
  {
    id: 'job-creation',
    label: '10 Jobs Requirement',
    question: 'How many jobs must each EB-5 investor create, and can indirect jobs count?',
    category: 'Compliance',
    icon: '👥',
  },
  {
    id: 'rc-vs-direct',
    label: 'Regional Center vs Direct',
    question: 'What is the difference between a Regional Center project and a Direct investment?',
    category: 'Structure',
    icon: '🏢',
  },
  {
    id: 'timeline',
    label: 'Processing Timeline',
    question: 'What is the expected timeline from Form I-526E filing to Green Card receipt?',
    category: 'Timeline',
    icon: '⏱️',
  },
  {
    id: 'source-of-funds',
    label: 'Source of Funds',
    question: 'What documentation is required by USCIS to prove lawful source of funds?',
    category: 'Documentation',
    icon: '🛡️',
  },
]

interface QuestionInsightsBarProps {
  onSelectQuestion: (question: string) => void
  disabled?: boolean
  compact?: boolean
}

export function QuestionInsightsBar({
  onSelectQuestion,
  disabled = false,
  compact = false,
}: QuestionInsightsBarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="border-t border-navy-100/80 bg-gradient-to-r from-ivory-50 via-white to-ivory-50 px-3 py-2 flex-shrink-0 transition-all select-none">
      <div className={`mx-auto ${compact ? 'max-w-full' : 'max-w-3xl'}`}>
        {/* Header Toggle */}
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <div className="flex items-center gap-1.5 text-navy-800">
            <span className="w-4 h-4 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-gold-600" />
            </span>
            <span className="text-[11px] font-bold tracking-tight">
              Question Insights & FAQs
            </span>
            <span className="text-[9px] bg-gold-50 text-gold-700 font-semibold px-1.5 py-0.2 rounded border border-gold-200">
              1-Click
            </span>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="text-[10px] text-navy-400 hover:text-navy-700 font-medium inline-flex items-center gap-0.5 transition-colors"
          >
            {collapsed ? (
              <>
                <span>Show Insights</span>
                <ChevronDown className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Collapse</span>
                <ChevronUp className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Question Chips */}
        {!collapsed && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {QUESTION_INSIGHTS.map((q) => (
              <button
                key={q.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectQuestion(q.question)}
                title={q.question}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-xl bg-white border border-navy-200 text-navy-800 hover:border-gold-400 hover:bg-gold-50/50 hover:text-navy-950 shadow-sm transition-all whitespace-nowrap flex-shrink-0 group disabled:opacity-50 disabled:pointer-events-none"
              >
                <span className="text-xs">{q.icon}</span>
                <span>{q.label}</span>
                <ChevronRight className="w-3 h-3 text-navy-300 group-hover:text-gold-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
