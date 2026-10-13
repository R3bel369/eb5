import { Link } from 'react-router-dom'
import { MessageSquare, Mail, Globe } from 'lucide-react'

export function ContactPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-hero-gradient text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="section-label text-gold-400 mb-3">Contact</p>
          <h1 className="font-display text-4xl font-bold mb-4">Connect With Shoora EB-5</h1>
          <p className="text-navy-200 text-lg">
            Ready to explore how the EB-5 program might align with your goals?
            Our team is here to help with personalized educational guidance.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {/* AI chatbot */}
          <div className="card-hover text-center">
            <div className="w-14 h-14 rounded-2xl bg-gold-100 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-gold-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-navy-900 mb-2">AI EB-5 Assistant</h2>
            <p className="text-navy-500 text-sm mb-6">
              Get immediate answers to general EB-5 questions. No registration required for general inquiries.
            </p>
            <Link to="/conversation" className="btn-primary w-full">
              Start a Conversation
            </Link>
          </div>

          {/* Advisor request */}
          <div className="card-hover text-center">
            <div className="w-14 h-14 rounded-2xl bg-navy-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-navy-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-navy-900 mb-2">Request a Consultation</h2>
            <p className="text-navy-500 text-sm mb-6">
              Speak with a Shoora EB-5 advisor for personalized educational guidance tailored to your situation.
            </p>
            <Link to="/conversation" className="btn-secondary w-full">
              Request via Assistant
            </Link>
          </div>
        </div>

        {/* External resources */}
        <div className="mt-12 card bg-navy-50">
          <div className="flex items-start gap-4">
            <Globe className="w-6 h-6 text-navy-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-navy-900 mb-2">Official Government Resources</h3>
              <p className="text-navy-500 text-sm mb-3">
                For authoritative information about the EB-5 program, always refer to official USCIS resources:
              </p>
              <ul className="space-y-2">
                <li>
                  <a href="https://www.uscis.gov/working-in-the-united-states/permanent-workers/eb-5-immigrant-investor-program" target="_blank" rel="noopener noreferrer" className="text-sm text-gold-600 hover:text-gold-700 font-medium">
                    USCIS EB-5 Immigrant Investor Program →
                  </a>
                </li>
                <li>
                  <a href="https://eb5.uscis.gov" target="_blank" rel="noopener noreferrer" className="text-sm text-gold-600 hover:text-gold-700 font-medium">
                    EB-5 Immigrant Investor Data Hub →
                  </a>
                </li>
                <li>
                  <a href="https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html" target="_blank" rel="noopener noreferrer" className="text-sm text-gold-600 hover:text-gold-700 font-medium">
                    DOS Visa Bulletin (Priority Dates) →
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-navy-400 text-xs text-center mt-8">
          Shoora EB-5 provides educational information and facilitates advisor connections.
          We do not provide legal advice or guarantee immigration outcomes.
          Consult qualified U.S. immigration attorneys for individualized guidance.
        </p>
      </div>
    </div>
  )
}
