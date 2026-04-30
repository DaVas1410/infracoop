import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

interface Profile { id: string; email: string; rol: 'admin' | 'curadora' }

interface AuthContextType {
  user: User | null
  perfil: Profile | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null; rol: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, perfil: null, isLoading: true,
  signIn: async () => ({ error: null, rol: null }),
  signOut: async () => {},
})

export function useAuth() { return useContext(AuthContext) }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadPerfil(u: User): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single()
    const p = data as Profile ?? null
    setPerfil(p)
    return p
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadPerfil(session.user).finally(() => setIsLoading(false))
      else setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadPerfil(session.user)
      else setPerfil(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string): Promise<{ error: string | null; rol: string | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message, rol: null }
    const p = data.user ? await loadPerfil(data.user) : null
    return { error: null, rol: p?.rol ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, perfil, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
