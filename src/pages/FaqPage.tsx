import { Link } from 'react-router-dom'
import { MessageSquare, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'

const FAQ_ITEMS = [
  {
    q: 'What is the EB-5 Immigrant Investor Program?',
    a: 'The EB-5 program, established by Congress in 1990, allows foreign nationals to obtain a U.S. green card (lawful permanent residence) by making a qualifying capital investment in a new commercial enterprise that creates full-time jobs for U.S. workers. The program is administered by U.S. Citizenship and Immigration Services (USCIS).',
  },
  {
    q: 'What are the current minimum investment amounts?',
    a: 'As of the EB-5 Reform and Integrity Act of 2022, the minimum investment is $800,000 for Targeted Employment Areas (TEAs) — rural areas or areas with high unemployment — and $1,050,000 for non-TEA locations. These amounts are adjusted periodically for inflation.',
  },
  {
    q: 'How many jobs must my investment create?',
    a: 'Each EB-5 investor must create or preserve at least 10 full-time positions for qualifying U.S. workers. For regional center investments, these can be direct, indirect, or induced jobs calculated using economic methodologies. For direct investments, all 10 must be direct employees of the enterprise.',
  },
  {
    q: 'What is a Regional Center?',
    a: 'A USCIS-designated Regional Center is an organization that pools EB-5 investor capital and deploys it into projects within a defined geographic area. Regional Centers allow job counting to include indirect and induced jobs in addition to direct employees, which can make meeting the 10-job requirement more straightforward for investors.',
  },
  {
    q: 'What family members can be included?',
    a: 'An EB-5 petition covers the principal investor, their spouse, and unmarried children under 21 years of age at the time of filing. Each family member would receive conditional permanent resident status if the petition is approved and visa processing is completed.',
  },
  {
    q: 'What is conditional permanent residence?',
    a: 'Initially, EB-5 investors and their family members receive conditional green cards valid for two years. Within the 90-day window before the card expires, the investor must file Form I-829 (Petition by Investor to Remove Conditions) to demonstrate that the investment was sustained and the required jobs were created.',
  },
  {
    q: 'What is the difference between direct investment and a Regional Center?',
    a: 'Direct investment requires the investor to be directly involved in managing or overseeing the enterprise. Regional Center investments allow a more passive role, with the Regional Center managing the project. Regional Centers also allow indirect job counting, which is a significant practical difference.',
  },
  {
    q: 'Does Shoora EB-5 guarantee visa approval or investment returns?',
    a: 'No. Shoora EB-5 provides educational information and advisor consultations. Immigration outcomes depend on individual circumstances, USCIS adjudication, visa availability, and other factors entirely outside our control. Investment in EB-5 projects carries risk, and no returns are guaranteed. Always consult qualified legal and financial professionals.',
  },
  {
    q: 'How do I get personalized guidance?',
    a: 'You can request a consultation with the Shoora EB-5 advisor team through our chatbot or contact page. An advisor will reach out to discuss your situation, answer specific questions, and explain how Shoora can assist with your inquiry. This consultation is informational — it does not constitute legal advice.',
  },
]

function AccordionItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div className={cn('border border-navy-100 rounded-xl overflow-hidden transition-all', open && 'border-navy-300')}>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-navy-50 transition-colors"
        aria-expanded={open}
      >
        <span className={cn('font-medium text-sm leading-snug', open ? 'text-navy-900' : 'text-navy-700')}>{q}</span>
        <ChevronDown className={cn('w-4 h-4 text-navy-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-6 pb-5">
          <div className="divider mb-4" />
          <p className="text-navy-600 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

export function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-hero-gradient text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="section-label text-gold-400 mb-3">FAQ</p>
          <h1 className="font-display text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-navy-200 text-lg">
            Common questions about the EB-5 Immigrant Investor Program — answered with reference to official USCIS guidelines.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem
              key={i}
              q={item.q}
              a={item.a}
              open={openIdx === i}
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-navy-50 border border-navy-200 text-center">
          <p className="text-navy-700 font-medium mb-2">Have a question not answered here?</p>
          <p className="text-navy-500 text-sm mb-6">
            Our AI assistant can help with general EB-5 questions, or you can speak with an advisor.
          </p>
          <Link to="/conversation" className="btn-primary">
            <MessageSquare className="w-4 h-4" />
            Ask the EB-5 Assistant
          </Link>
        </div>

        <p className="text-navy-400 text-xs text-center mt-8">
          Information is educational only and based on publicly available USCIS guidelines.
          Not legal or investment advice. Consult qualified professionals before making decisions.
        </p>
      </div>
    </div>
  )
}
