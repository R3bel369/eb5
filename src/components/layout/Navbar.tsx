import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageSquare, LogIn, LogOut, LayoutDashboard, ChevronDown, Menu, X, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setUserMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-navy-100 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
            aria-label="Shoora EB-5 Home"
          >
            <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white font-display font-bold text-base">S</span>
            </div>
            <div>
              <div className="font-display font-bold text-navy-900 text-lg leading-none">Shoora</div>
              <div className="text-gold-600 text-xs font-semibold tracking-wider">EB-5 AI</div>
            </div>
          </Link>

          {/* Desktop right actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Admin quick access */}
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-navy-700 hover:text-navy-900 hover:bg-navy-50 border border-navy-200 transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-gold-600" />
              <span>Admin CRM</span>
            </Link>

            {/* Start conversation button */}
            <Link to="/conversation" className="btn-gold text-sm py-2">
              <MessageSquare className="w-4 h-4" />
              Start a Conversation
            </Link>

            {user ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-navy-200 hover:bg-navy-50 transition-colors text-sm font-medium text-navy-700"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-7 h-7 rounded-full bg-navy-800 flex items-center justify-center text-white text-xs font-semibold">
                    {(user.email || user.phone || 'U')[0].toUpperCase()}
                  </div>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-card-hover border border-navy-100 py-1 z-50 animate-slide-up">
                    <div className="px-4 py-2 border-b border-navy-50">
                      <p className="text-xs text-navy-400 truncate">{user.email || user.phone}</p>
                      <p className="text-[11px] text-gold-600 font-medium">Verified Investor</p>
                    </div>
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-navy-700 hover:bg-navy-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 text-gold-600" />
                      Admin Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/sign-in" className="btn-secondary text-sm py-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-btn"
            className="sm:hidden p-2 rounded-lg text-navy-700 hover:bg-navy-50 transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden py-4 border-t border-navy-100 animate-slide-up space-y-2">
            <Link
              to="/conversation"
              className="btn-gold text-sm w-full justify-center"
              onClick={() => setMobileOpen(false)}
            >
              <MessageSquare className="w-4 h-4" />
              Start a Conversation
            </Link>

            <Link
              to="/admin"
              className="btn-secondary text-sm w-full justify-center"
              onClick={() => setMobileOpen(false)}
            >
              <LayoutDashboard className="w-4 h-4 text-gold-600" />
              Admin CRM
            </Link>

            {user ? (
              <button
                onClick={() => { handleSignOut(); setMobileOpen(false) }}
                className="btn-ghost text-red-600 w-full justify-center text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out ({user.email || user.phone})
              </button>
            ) : (
              <Link
                to="/sign-in"
                className="btn-secondary text-sm w-full justify-center"
                onClick={() => setMobileOpen(false)}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Click-outside to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  )
}
