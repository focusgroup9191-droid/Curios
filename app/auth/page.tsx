'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, username)
      }
      router.push('/discuss')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F0F14', color: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontFamily: 'Georgia, serif', margin: 0 }}>
            <span style={{ color: '#C9935A', marginRight: '0.5rem' }}>✦</span>Curios
          </h1>
          <p style={{ color: '#A7A29A', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>Thoughtful conversations, instantly</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={mode === 'signup'}
              style={{
                padding: '0.75rem',
                background: '#16161E',
                border: '1px solid #4A5568',
                color: '#F5F0E8',
                borderRadius: '0.5rem',
              }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: '0.75rem',
              background: '#16161E',
              border: '1px solid #4A5568',
              color: '#F5F0E8',
              borderRadius: '0.5rem',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: '0.75rem',
              background: '#16161E',
              border: '1px solid #4A5568',
              color: '#F5F0E8',
              borderRadius: '0.5rem',
            }}
          />
          {error && <p style={{ color: '#B4564B', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem',
              background: '#C9935A',
              border: 'none',
              color: '#0F0F14',
              fontWeight: 600,
              borderRadius: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#C9935A',
              cursor: 'pointer',
              textDecoration: 'underline',
              font: 'inherit',
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
