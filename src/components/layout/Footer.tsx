import { Link } from 'react-router-dom'
import { MessageSquare, LayoutDashboard, Globe, Shield } from 'lucide-react'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-navy-950 text-navy-300 mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm font-display">S</span>
              </div>
              <div>
                <div className="text-white font-display font-bold text-sm">Shoora</div>
                <div className="text-gold-400 text-xs font-medium">EB-5 AI Platform</div>
              </div>
            </div>
            <p className="text-sm text-navy-400 leading-relaxed max-w-sm">
              AI-driven educational guidance, investor readiness scoring, and CRM lead capture for the EB-5 Immigrant Investor Program.
            </p>
          </div>

          {/* Quick Access */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Quick Access</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/conversation" className="hover:text-gold-400 transition-colors flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-gold-500" />
                  EB-5 Chatbot Assistant
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-gold-400 transition-colors flex items-center gap-2">
                  <LayoutDashboard className="w-3.5 h-3.5 text-gold-500" />
                  Admin CRM & Leads Dashboard
                </Link>
              </li>
              <li>
                <Link to="/sign-in" className="hover:text-gold-400 transition-colors">
                  Investor Sign In & OTP Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Resources */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Official USCIS Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.uscis.gov/working-in-the-united-states/permanent-workers/eb-5-immigrant-investor-program"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold-400 transition-colors flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5 text-gold-500" />
                  USCIS EB-5 Program Guidelines
                </a>
              </li>
              <li>
                <a
                  href="https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold-400 transition-colors flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5 text-gold-500" />
                  U.S. Department of State Visa Bulletin
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-800 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-navy-500">
            © {year} Shoora EB-5. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-navy-400 max-w-2xl">
            <Shield className="w-4 h-4 flex-shrink-0 text-gold-500" />
            <span>
              Disclaimer: Content provided is educational and informational only. It does not constitute legal, tax, or financial investment advice. Consult a licensed immigration attorney before filing Form I-526E.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
