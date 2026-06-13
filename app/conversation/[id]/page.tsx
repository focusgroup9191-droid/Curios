'use client'
import { useEffect, useRef, useState } from 'react'
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
  const callContainerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const frameRef = useRef<any>(null)
  const frameCreatedRef = useRef(false)

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

  // Start Daily call once conversation is loaded
  useEffect(() => {
    if (!convo || frameCreatedRef.current || !callContainerRef.current) return
    if (typeof window === 'undefined') return

    let cancelled = false

    const startCall = async () => {
      const res = await fetch('/api/daily-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convo.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.url) {
        if (!cancelled) setError(json.error ?? 'Failed to get room URL')
        return
      }

      if (cancelled || frameCreatedRef.current || !callContainerRef.current) return

      const DailyIframe = (await import('@daily-co/daily-js')).default
      frameCreatedRef.current = true
      const frame = DailyIframe.createFrame(callContainerRef.current, {
        iframeStyle: { width: '100%', height: '100%', border: 'none', borderRadius: '0.75rem' },
        showLeaveButton: false,
        showFullscreenButton: true,
      })
      frameRef.current = frame
      await frame.join({ url: json.url })
    }

    startCall()

    return () => {
      cancelled = true
      if (frameRef.current) {
        frameRef.current.leave().catch(() => {})
        frameRef.current.destroy()
        frameRef.current = null
        frameCreatedRef.current = false
      }
    }
  }, [convo])

  const leave = async () => {
    if (frameRef.current) {
      await frameRef.current.leave().catch(() => {})
      frameRef.current.destroy()
      frameRef.current = null
      frameCreatedRef.current = false
    }
    await supabase.from('conversations').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', id)
    router.push(`/score/${id}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.ink, color: C.parchment, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', gap: '1.25rem' }}>
      {loading && <p style={{ color: C.parchmentDim }}>Loading conversation…</p>}
      {error && <p style={{ color: C.leave }}>{error}</p>}
      {convo && (
        <>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5, color: C.lavender }}>{convo.topic?.category}</span>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', textAlign: 'center', maxWidth: 600, margin: 0 }}>{convo.topic?.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: C.inkCard, border: `1px solid ${C.sage}55`, borderRadius: '0.75rem', padding: '1rem 1.5rem' }}>{convo.user_a?.username ?? '—'}</div>
            <span style={{ color: C.amber, fontSize: '1.5rem' }}>✦</span>
            <div style={{ background: C.inkCard, border: `1px solid ${C.lavender}55`, borderRadius: '0.75rem', padding: '1rem 1.5rem' }}>{convo.user_b?.username ?? '—'}</div>
          </div>
          <p style={{ color: C.sage, margin: 0 }}>● You're matched — the floor is yours.</p>

          {/* Daily call frame */}
          <div
            ref={callContainerRef}
            style={{
              width: '100%',
              maxWidth: 900,
              height: 520,
              background: C.inkCard,
              border: `1px solid ${C.slate}55`,
              borderRadius: '0.75rem',
              overflow: 'hidden',
            }}
          />

          <button onClick={leave} style={{ background: C.leave, border: 'none', color: '#fff', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
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
