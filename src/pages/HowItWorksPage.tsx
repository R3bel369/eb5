import { Link } from 'react-router-dom'
import { CheckCircle, ArrowRight, MessageSquare } from 'lucide-react'

const STEPS = [
  {
    phase: 'Phase 1',
    title: 'Research and Education',
    duration: 'Ongoing',
    color: 'bg-navy-600',
    steps: [
      'Learn the EB-5 program basics and current requirements.',
      'Understand the difference between direct investment and Regional Center models.',
      'Research visa availability for your country of birth.',
      'Evaluate whether the EB-5 pathway aligns with your immigration goals.',
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Professional Consultation',
    duration: 'Weeks to months',
    color: 'bg-gold-500',
    steps: [
      'Engage qualified U.S. immigration counsel and financial advisors.',
      'Evaluate specific EB-5 projects or direct investment opportunities.',
      'Review source and path of funds documentation requirements.',
      'Obtain independent project due diligence from qualified professionals.',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Investment and Petition Filing',
    duration: 'Months',
    color: 'bg-navy-700',
    steps: [
      'Complete capital investment per EB-5 requirements.',
      'Prepare and file Form I-526E or I-526 with USCIS.',
      'Await USCIS adjudication of the investor petition.',
      'Monitor processing status and respond to any USCIS requests.',
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Visa Processing',
    duration: 'Varies significantly by country',
    color: 'bg-navy-800',
    steps: [
      'After I-526/I-526E approval, apply for immigrant visa or adjustment of status.',
      'Monitor Visa Bulletin for priority date movement.',
      'Complete consular interview or adjustment of status process.',
      'Receive conditional lawful permanent residence.',
    ],
  },
  {
    phase: 'Phase 5',
    title: 'Removing Conditions',
    duration: 'Year 2–3 after green card',
    color: 'bg-emerald-600',
    steps: [
      'Maintain investment and enterprise as required.',
      'Ensure job creation requirements have been met.',
      'File Form I-829 within the 90-day window before the conditional card expires.',
      'Receive unconditional lawful permanent residence upon approval.',
    ],
  },
]

export function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-hero-gradient text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="section-label text-gold-400 mb-3">Process Overview</p>
          <h1 className="font-display text-4xl font-bold mb-4">How the EB-5 Process Works</h1>
          <p className="text-navy-200 text-lg max-w-2xl mx-auto">
            A high-level educational overview of the EB-5 Immigrant Investor Program process.
            Actual timelines and requirements vary by individual circumstances.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-navy-600 via-gold-500 to-emerald-600 hidden sm:block" />

          <div className="space-y-10">
            {STEPS.map((step, idx) => (
              <div key={idx} className="relative sm:pl-16">
                {/* Phase dot */}
                <div className={`absolute left-0 top-4 w-12 h-12 rounded-full ${step.color} hidden sm:flex items-center justify-center shadow-card z-10`}>
                  <span className="text-white font-bold text-xs">{idx + 1}</span>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="section-label mb-1">{step.phase}</p>
                      <h2 className="font-display text-xl font-bold text-navy-900">{step.title}</h2>
                    </div>
                    <span className="badge-navy whitespace-nowrap">{step.duration}</span>
                  </div>
                  <ul className="space-y-2">
                    {step.steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 text-navy-600 text-sm">
                        <CheckCircle className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-5 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-amber-700 text-sm">
            <strong>Important:</strong> This is a high-level educational overview. EB-5 is a complex immigration and investment program.
            Actual timelines depend on USCIS processing times, visa bulletin movement, individual circumstances, and other factors.
            Always consult qualified U.S. immigration attorneys and financial advisors before proceeding.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-navy-600 font-medium mb-4">Ready to learn more or connect with an advisor?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/conversation" className="btn-primary">
              <MessageSquare className="w-4 h-4" />
              Ask the EB-5 Assistant
            </Link>
            <Link to="/faq" className="btn-secondary">
              View FAQs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
