import { Link } from 'react-router-dom'
import { MessageSquare, ExternalLink } from 'lucide-react'

const SECTIONS = [
  {
    title: 'The EB-5 Investment',
    items: [
      {
        heading: 'Minimum Capital Requirement',
        text: 'The EB-5 program requires a minimum capital investment of $800,000 in a Targeted Employment Area (TEA) or $1,050,000 in a non-TEA project. These amounts were set by the EB-5 Reform and Integrity Act of 2022 and are subject to adjustment for inflation.',
        source: 'https://www.uscis.gov/working-in-the-united-states/permanent-workers/eb-5-immigrant-investor-program',
      },
      {
        heading: 'What Is a Targeted Employment Area?',
        text: 'A TEA is either a rural area or an area that has experienced high unemployment (at least 150% of the national average). TEA designation is made at the time of investment and determines which investment threshold applies.',
      },
      {
        heading: 'Source and Path of Funds',
        text: 'Investors must demonstrate that their capital was lawfully obtained. USCIS reviews source of funds evidence during adjudication. Qualified legal counsel typically helps investors prepare the required documentation — this is a critical component of a complete EB-5 petition.',
      },
    ],
  },
  {
    title: 'Job Creation',
    items: [
      {
        heading: 'The 10-Job Requirement',
        text: 'Each EB-5 investor must create or preserve at least 10 full-time positions for qualifying U.S. workers. Workers must be authorized to work in the United States.',
      },
      {
        heading: 'Direct vs. Indirect Jobs',
        text: 'For direct investments, all 10 jobs must be direct employees. For Regional Center investments, USCIS permits counting direct, indirect, and induced jobs using approved economic methodologies, which often makes meeting this threshold more flexible.',
      },
      {
        heading: 'Job Creation Documentation',
        text: 'Investors must demonstrate actual or projected job creation. For new commercial enterprises, this typically requires business plans, economic analyses, and ongoing compliance reporting.',
      },
    ],
  },
  {
    title: 'The Immigration Process',
    items: [
      {
        heading: 'Form I-526E: Immigrant Petition',
        text: 'The investor files Form I-526E (Immigrant Petition by Regional Center Investor) or I-526 (for direct investments) with USCIS. This initiates the immigration process and requires extensive documentation of the investment and job creation.',
        source: 'https://www.uscis.gov/i-526e',
      },
      {
        heading: 'Visa Availability and Priority Dates',
        text: 'After I-526E approval, investors apply for a visa through consular processing (Form DS-260) or adjustment of status (Form I-485) if already in the U.S. Visa availability depends on country of birth and the Visa Bulletin. Significant backlogs exist for some countries.',
        source: 'https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html',
      },
      {
        heading: 'Conditional Permanent Residence',
        text: 'Approved investors and qualifying family members receive a two-year conditional green card. Before expiry, the investor must file Form I-829 to remove conditions by demonstrating the investment was sustained and jobs were created.',
        source: 'https://www.uscis.gov/i-829',
      },
    ],
  },
  {
    title: 'Regional Centers',
    items: [
      {
        heading: 'What Is a USCIS-Designated Regional Center?',
        text: 'A Regional Center is an organization authorized by USCIS to pool EB-5 investor capital for deployment in approved projects within a defined geographic area. Regional Centers must comply with ongoing USCIS oversight and reporting requirements under the EB-5 Reform and Integrity Act.',
      },
      {
        heading: 'Project Due Diligence',
        text: 'When evaluating a Regional Center project, investors should consider factors such as the project\'s business plan, financial projections, escrow arrangements, job creation methodology, the experience of the project developers, and independent legal and financial review. This is not an exhaustive list — qualified professionals should advise on each specific project.',
      },
    ],
  },
]

export function Eb5InfoPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-hero-gradient text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="section-label text-gold-400 mb-3">Educational Resource</p>
          <h1 className="font-display text-4xl font-bold mb-4">Understanding EB-5</h1>
          <p className="text-navy-200 text-lg max-w-2xl mx-auto">
            An educational overview of the EB-5 Immigrant Investor Program based on official USCIS guidelines.
            This information is general and not specific to any individual situation.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Disclaimer */}
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 mb-12">
          <p className="text-amber-800 text-sm font-medium mb-1">Educational Information Only</p>
          <p className="text-amber-700 text-sm">
            The following information is provided for general educational purposes based on publicly available USCIS guidelines.
            It does not constitute legal advice. EB-5 requirements can change — always verify current requirements at{' '}
            <a href="https://www.uscis.gov" target="_blank" rel="noopener noreferrer" className="underline">uscis.gov</a>{' '}
            and consult qualified immigration counsel.
          </p>
        </div>

        {/* Sections */}
        {SECTIONS.map(section => (
          <div key={section.title} className="mb-12">
            <h2 className="font-display text-2xl font-bold text-navy-900 mb-6 pb-3 border-b border-navy-100">
              {section.title}
            </h2>
            <div className="space-y-6">
              {section.items.map(item => (
                <div key={item.heading} className="card">
                  <h3 className="font-display font-semibold text-navy-900 mb-2">{item.heading}</h3>
                  <p className="text-navy-600 text-sm leading-relaxed">{item.text}</p>
                  {item.source && (
                    <a
                      href={item.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700 font-medium mt-3"
                    >
                      <ExternalLink className="w-3 h-3" />
                      USCIS Source
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="text-center mt-8">
          <Link to="/conversation" className="btn-primary">
            <MessageSquare className="w-4 h-4" />
            Ask the EB-5 Assistant
          </Link>
          <p className="text-navy-400 text-xs mt-4">
            Have specific questions? Our AI assistant can provide additional educational context.
          </p>
        </div>
      </div>
    </div>
  )
}
