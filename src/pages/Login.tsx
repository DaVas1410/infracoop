import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const err = await signIn(email, password)
    if (err) { setError(err); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: p } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
      navigate(p?.rol === 'admin' ? '/revisar' : '/ingresar')
    } else {
      navigate('/ingresar')
    }
  }

  return (
    <main style={{ maxWidth: 360, margin: '6rem auto', padding: '0 1.5rem' }}>
      <h2 style={{ fontFamily: 'var(--serif)', marginBottom: '1.5rem' }}>Acceso curatorial</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="email" placeholder="Email" required value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--r)', border: '1px solid var(--ink-faint)', fontFamily: 'var(--sans)' }}
        />
        <input
          type="password" placeholder="Contraseña" required value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--r)', border: '1px solid var(--ink-faint)', fontFamily: 'var(--sans)' }}
        />
        {error && <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--warn)' }}>{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar →'}
        </button>
      </form>
    </main>
  )
}
