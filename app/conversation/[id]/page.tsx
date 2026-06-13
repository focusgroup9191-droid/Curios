'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'

const C = {
  ink: '#0F0F14', inkCard: '#1B1B25', parchment: '#F5F0E8', parchmentDim: '#A7A29A',
  amber: '#C9935A', sage: '#7A9E8E', lavender: '#9B8EC4', slate: '#4A5568', leave: '#B4564B',
}

interface Convo {
  id: string
  status: string
  topic: { title: string; category: string } | null
  user_a: { username: string } | null
  user_b: { username: string } | null
}

function ConversationContent() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [convo, setConvo] = useState<Convo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, status, topic:topics(title, category), user_a:users!conversations_user_a_id_fkey(username), user_b:users!conversations_user_b_id_fkey(username)')
        .eq('id', id)
        .single()

      if (error) {
        setError(error.message)
      } else {
        setConvo(data as unknown as Convo)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const leave = async () => {
    await supabase.from('conversations').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', id)
    router.push('/discuss')
  }

  return (
    <div style={{ minHeight: '100vh', background: C.ink, color: C.parchment, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', padding: '2rem' }}>
      {loading && <p style={{ color: C.parchmentDim }}>Loading conversation…</p>}
      {error && <p style={{ color: C.leave }}>{error}</p>}
      {convo && (
        <>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5, color: C.lavender }}>{convo.topic?.category}</span>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', textAlign: 'center', maxWidth: 600, margin: 0 }}>{convo.topic?.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
            <div style={{ background: C.inkCard, border: `1px solid ${C.sage}55`, borderRadius: '0.75rem', padding: '1rem 1.5rem' }}>{convo.user_a?.username ?? '—'}</div>
            <span style={{ color: C.amber, fontSize: '1.5rem' }}>✦</span>
            <div style={{ background: C.inkCard, border: `1px solid ${C.lavender}55`, borderRadius: '0.75rem', padding: '1rem 1.5rem' }}>{convo.user_b?.username ?? '—'}</div>
          </div>
          <p style={{ color: C.sage, marginTop: '0.5rem' }}>● You're matched — the floor is yours.</p>
          <p style={{ color: C.parchmentDim, fontSize: '0.85rem', maxWidth: 460, textAlign: 'center' }}>
            (Live voice &amp; video connect here next — for now this confirms the match worked end to end.)
          </p>
          <button onClick={leave} style={{ marginTop: '1rem', background: C.leave, border: 'none', color: '#fff', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
            Leave
          </button>
        </>
      )}
    </div>
  )
}

export default function ConversationPage() {
  return (
    <ProtectedRoute>
      <ConversationContent />
    </ProtectedRoute>
  )
}
