'use client'
import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'

const C = {
  ink: '#0F0F14', parchment: '#F5F0E8', parchmentDim: '#A7A29A',
  amber: '#C9935A', sage: '#7A9E8E', slate: '#4A5568',
}

function MatchContent() {
  const router = useRouter()
  const params = useSearchParams()
  const topicId = params.get('topic')
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!topicId) {
      router.push('/discuss')
      return
    }

    let cancelled = false

    const attempt = async () => {
      const { data, error } = await supabase.rpc('find_or_join_queue', { p_topic_id: topicId })
      if (cancelled) return
      if (error) {
        setError(error.message)
        return
      }
      if (data) {
        cleanup()
        router.push(`/conversation/${data}`)
        return
      }

      // RPC returned null — we may have been matched by the other participant.
      // Check if we're already in an active conversation for this topic.
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled || !user) return
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('topic_id', topicId)
        .eq('status', 'active')
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .maybeSingle()
      if (cancelled) return
      if (existing) {
        cleanup()
        router.push(`/conversation/${existing.id}`)
      }
    }

    const cleanup = () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }

    // first attempt immediately, then poll every 1.5s
    attempt()
    pollRef.current = setInterval(attempt, 1500)
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)

    return () => {
      cancelled = true
      cleanup()
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          supabase.from('queue').delete().eq('user_id', data.user.id)
        }
      })
    }
  }, [topicId, router])

  const cancel = async () => {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      await supabase.from('queue').delete().eq('user_id', data.user.id)
    }
    router.push('/discuss')
  }

  return (
    <div style={{ minHeight: '100vh', background: C.ink, color: C.parchment, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', border: `3px solid ${C.slate}`, borderTopColor: C.sage, animation: 'spin 1s linear infinite' }} />
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', margin: 0 }}>Finding someone curious…</h1>
      <p style={{ color: C.parchmentDim, margin: 0 }}>{seconds}s — hang tight, we're matching you with another mind.</p>
      {error && <p style={{ color: '#B4564B' }}>{error}</p>}
      <button onClick={cancel} style={{ marginTop: '1rem', background: 'transparent', border: `1px solid ${C.slate}`, color: C.parchmentDim, padding: '0.5rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
        Cancel
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function MatchPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <MatchContent />
      </Suspense>
    </ProtectedRoute>
  )
}
