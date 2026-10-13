import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types/database'

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  loginAsDemoAdmin: () => void
  loginWithAdminCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const loginAsDemoAdmin = useCallback(() => {
    const demoUser = {
      id: 'admin-local-1',
      email: 'admin@shoora.com',
      app_metadata: { role: 'admin' },
      user_metadata: { full_name: 'Shoora Administrator' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User

    setUser(demoUser)
    setIsAdmin(true)
    localStorage.setItem('shoora_demo_admin', 'true')
  }, [])

  const loginWithAdminCredentials = useCallback(
    async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      const cleanEmail = email.trim().toLowerCase()
      const cleanPass = pass.trim()

      // 1. Check default admin credentials: admin@shoora.com / ShooraAdmin2026! (or admin123)
      if (
        (cleanEmail === 'admin@shoora.com' || cleanEmail === 'admin') &&
        (cleanPass === 'ShooraAdmin2026!' || cleanPass === 'admin123' || cleanPass === 'admin')
      ) {
        loginAsDemoAdmin()
        return { success: true }
      }

      // 2. Try Supabase password auth if user exists in database
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        })
        if (!error && data.user) {
          setUser(data.user)
          setIsAdmin(true)
          return { success: true }
        }
      } catch (err) {
        console.warn('Supabase password auth failed:', err)
      }

      return {
        success: false,
        error: 'Invalid credentials. Default admin: admin@shoora.com / ShooraAdmin2026!',
      }
    },
    [loginAsDemoAdmin]
  )

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', userId)
      .single()
    if (data) setProfile(data)
  }, [])

  const checkAdminRole = useCallback(async (userId: string) => {
    // Check custom claims or a separate admin_users table
    const { data } = await supabase
      .from('admin_users')
      .select('role')
      .eq('auth_user_id', userId)
      .single()
    setIsAdmin(!!data)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    // Check local demo admin session first
    if (localStorage.getItem('shoora_demo_admin') === 'true') {
      const demoUser = {
        id: 'admin-local-1',
        email: 'admin@shoora.com',
        app_metadata: { role: 'admin' },
        user_metadata: { full_name: 'Shoora Administrator' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User
      setUser(demoUser)
      setIsAdmin(true)
      setLoading(false)
      return
    }

    // Initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        checkAdminRole(session.user.id)
      }
      setLoading(false)
    })

    // Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
          await checkAdminRole(session.user.id)
        } else if (localStorage.getItem('shoora_demo_admin') !== 'true') {
          setProfile(null)
          setIsAdmin(false)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile, checkAdminRole])

  const signOut = async () => {
    localStorage.removeItem('shoora_demo_admin')
    setUser(null)
    setIsAdmin(false)
    await supabase.auth.signOut().catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isAdmin, loginAsDemoAdmin, loginWithAdminCredentials, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
