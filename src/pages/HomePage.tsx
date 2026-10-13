import { Link } from 'react-router-dom'
import {
  MessageSquare, ArrowRight, Shield, Users, BookOpen,
  CheckCircle, Globe, TrendingUp, ChevronRight
} from 'lucide-react'

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section
      className="relative min-h-[90vh] flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #040b1e 0%, #0f2349 45%, #163368 75%, #1e4589 100%)' }}
    >
      {/* Decorative grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-navy-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: Text content */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-500/15 border border-gold-500/30 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse-soft" />
              <span className="text-gold-300 text-xs font-semibold tracking-wide uppercase">
                EB-5 Immigrant Investor Program
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-white leading-[1.15] mb-6 text-balance">
              Explore Your U.S.{' '}
              <span className="gold-text">Immigration Investment</span>{' '}
              Journey With Confidence.
            </h1>

            <p className="text-navy-200 text-lg leading-relaxed mb-10 max-w-xl">
              Understand the EB-5 process, explore important considerations, and connect with the Shoora EB-5 team for personalized guidance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/conversation"
                id="hero-cta-assistant"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-white font-semibold text-sm shadow-lg hover:shadow-gold-500/25 transition-all duration-200 group"
              >
                <MessageSquare className="w-4 h-4" />
                Ask Our EB-5 Assistant
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/understanding-eb5"
                id="hero-cta-process"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-sm transition-all duration-200"
              >
                Understand the EB-5 Process
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 mt-10">
              {[
                { icon: Shield,   label: 'Secure & Private' },
                { icon: BookOpen, label: 'USCIS-Aligned Information' },
                { icon: Users,    label: 'Expert Advisor Team' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-navy-300 text-sm">
                  <Icon className="w-4 h-4 text-gold-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Stats glass card */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-glass">
              <h2 className="text-white font-display font-semibold text-xl mb-6">
                EB-5 Program Overview
              </h2>
              <div className="space-y-5">
                {[
                  {
                    label: 'Minimum Investment',
                    value: '$800,000',
                    sub: 'Targeted Employment Areas',
                    color: 'text-gold-300',
                  },
                  {
                    label: 'Standard Investment',
                    value: '$1,050,000',
                    sub: 'Non-TEA Projects',
                    color: 'text-gold-300',
                  },
                  {
                    label: 'Job Creation Requirement',
                    value: '10 Jobs',
                    sub: 'Full-time U.S. workers per investor',
                    color: 'text-emerald-300',
                  },
                  {
                    label: 'Eligible Family Members',
                    value: 'Spouse + Children',
                    sub: 'Unmarried, under 21 years of age',
                    color: 'text-blue-300',
                  },
                ].map(item => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div>
                      <p className="text-navy-300 text-xs font-medium mb-0.5">{item.label}</p>
                      <p className={`font-display font-bold text-lg ${item.color}`}>{item.value}</p>
                      <p className="text-navy-400 text-xs mt-0.5">{item.sub}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-1" />
                  </div>
                ))}
              </div>
              <p className="text-navy-400 text-xs mt-4 text-center">
                Source: USCIS.gov — Educational reference only
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Suggested Questions ──────────────────────────────────────────────────────

function SuggestedQuestions() {
  const questions = [
    'What is the EB-5 program?',
    'What are the investment requirements?',
    'How does the EB-5 process work?',
    'Can eligible family members be included?',
    'What should I know before evaluating an EB-5 project?',
    'Can I speak with a Shoora EB-5 advisor?',
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="section-label mb-3">AI Assistant</p>
          <h2 className="font-display text-3xl font-bold text-navy-900 mb-4">
            Ask Anything About EB-5
          </h2>
          <p className="text-navy-500 text-lg max-w-2xl mx-auto">
            Our AI assistant provides educational answers based on official USCIS guidelines.
            No registration required for general questions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {questions.map((q) => (
            <Link
              key={q}
              to={`/conversation?q=${encodeURIComponent(q)}`}
              className="group flex items-center justify-between gap-3 p-4 rounded-xl border border-navy-100 bg-ivory-50 hover:bg-white hover:border-navy-300 hover:shadow-card transition-all duration-200"
            >
              <span className="text-navy-700 text-sm font-medium leading-snug">{q}</span>
              <ChevronRight className="w-4 h-4 text-navy-300 group-hover:text-gold-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link to="/conversation" className="btn-primary">
            <MessageSquare className="w-4 h-4" />
            Open the EB-5 Assistant
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Process Steps ────────────────────────────────────────────────────────────

function ProcessSteps() {
  const steps = [
    {
      number: '01',
      title: 'Understand the Program',
      description: 'Learn the EB-5 requirements, investment thresholds, and job creation obligations from authoritative USCIS sources.',
      icon: BookOpen,
    },
    {
      number: '02',
      title: 'Explore Your Options',
      description: 'Evaluate direct investment and regional center models, and understand project due diligence considerations.',
      icon: Globe,
    },
    {
      number: '03',
      title: 'Connect With Advisors',
      description: 'Request a personalized consultation with the Shoora EB-5 team for guidance tailored to your situation.',
      icon: Users,
    },
    {
      number: '04',
      title: 'Begin Your Journey',
      description: 'With professional guidance, pursue your path to U.S. conditional permanent residence through the EB-5 program.',
      icon: TrendingUp,
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-ivory-100 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="section-label mb-3">Process Overview</p>
          <h2 className="font-display text-3xl font-bold text-navy-900 mb-4">
            Your Path to Understanding EB-5
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div key={step.number} className="relative">
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-navy-200 to-transparent z-0" />
              )}
              <div className="card-hover relative z-10 text-center h-full">
                <div className="w-16 h-16 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-4 shadow-card">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-gold-500 font-display font-bold text-sm mb-2">{step.number}</div>
                <h3 className="font-display font-semibold text-navy-900 mb-2">{step.title}</h3>
                <p className="text-navy-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/how-it-works" className="btn-secondary">
            View Full Process Details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <section className="py-20 bg-hero-gradient">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="section-label text-gold-400 mb-4">Ready to Begin?</p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-6 text-balance">
          Start Your EB-5 Inquiry Today
        </h2>
        <p className="text-navy-200 text-lg mb-10 max-w-2xl mx-auto">
          Ask our AI assistant general questions or request a consultation with a Shoora EB-5 advisor.
          Your information is protected and never shared without your consent.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/conversation" id="cta-banner-btn" className="btn-gold">
            <MessageSquare className="w-4 h-4" />
            Ask the EB-5 Assistant
          </Link>
          <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all">
            Contact Our Team
          </Link>
        </div>
        <p className="text-navy-400 text-xs mt-8">
          Educational information only. Not legal or investment advice. Consult qualified professionals.
        </p>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function HomePage() {
  return (
    <>
      <HeroSection />
      <SuggestedQuestions />
      <ProcessSteps />
      <CtaBanner />
    </>
  )
}
