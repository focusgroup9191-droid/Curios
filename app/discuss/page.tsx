'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Topic {
  id: string
  title: string
  category: string
  description: string | null
}

const C = {
  ink: '#0F0F14', inkCard: '#1B1B25', parchment: '#F5F0E8', parchmentDim: '#A7A29A',
  amber: '#C9935A', sage: '#7A9E8E', lavender: '#9B8EC4', slate: '#4A5568',
}

function DiscussContent() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTopics = async () => {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setTopics(data ?? [])
      }
      setLoading(false)
    }
    fetchTopics()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.ink, color: C.parchment, padding: '2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', margin: 0 }}>
              <span style={{ color: C.amber, marginRight: '0.5rem' }}>✦</span>Curios
            </h1>
            <p style={{ color: C.parchmentDim, margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>What are you curious about today?</p>
          </div>
          <button onClick={signOut} style={{ background: 'transparent', border: `1px solid ${C.slate}`, color: C.parchmentDim, padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Sign out
          </button>
        </header>

        {loading && <p style={{ color: C.parchmentDim }}>Loading topics…</p>}
        {error && <p style={{ color: '#B4564B' }}>{error}</p>}

        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {topics.map((t) => (
              <div key={t.id} onClick={() => router.push(`/match?topic=${t.id}`)} onMouseEnter={() => setHoveredId(t.id)} onMouseLeave={() => setHoveredId(null)} style={{ background: C.inkCard, border: `1px solid ${hoveredId === t.id ? C.amber : `${C.slate}33`}`, borderRadius: '0.75rem', padding: '1.25rem', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: C.lavender }}>{t.category}</span>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', margin: '0.5rem 0' }}>{t.title}</h3>
                {t.description && <p style={{ color: C.parchmentDim, fontSize: '0.85rem', margin: 0 }}>{t.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DiscussPage() {
  return (
    <ProtectedRoute>
      <DiscussContent />
    </ProtectedRoute>
  )
}
