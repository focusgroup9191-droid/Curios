'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'

const C = {
  ink: '#0F0F14', inkCard: '#1B1B25', parchment: '#F5F0E8', parchmentDim: '#A7A29A',
  amber: '#C9935A', sage: '#7A9E8E', lavender: '#9B8EC4', slate: '#4A5568',
  border: '#2A2A38',
}

interface UserScore {
  depth_of_thought: number
  clarity: number
  active_listening: number
  use_of_evidence: number
  open_mindedness: number
  overall_score: number
  summary: string
  personal_note: string
}

interface Scores {
  user_a: UserScore
  user_b: UserScore
}

interface Convo {
  id: string
  topic: { title: string; category: string } | null
  user_a: { username: string } | null
  user_b: { username: string } | null
}

const DIMENSIONS: { key: keyof UserScore; label: string }[] = [
  { key: 'depth_of_thought', label: 'Depth of Thought' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'active_listening', label: 'Active Listening' },
  { key: 'use_of_evidence', label: 'Use of Evidence' },
  { key: 'open_mindedness', label: 'Open-Mindedness' },
]

function ScoreBar({ value }: { value: number }) {
  const pct = Math.round((value / 10) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: C.amber, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ color: C.amber, fontWeight: 700, fontSize: '0.85rem', minWidth: 24 }}>{value}</span>
    </div>
  )
}

function ScoreCard({ name, score, accent }: { name: string; score: UserScore; accent: string }) {
  return (
    <div style={{ background: C.inkCard, border: `1px solid ${accent}44`, borderRadius: '0.75rem', padding: '1.5rem', flex: 1, minWidth: 280 }}>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: C.parchment, margin: '0 0 0.25rem' }}>{name}</h2>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '2.5rem', fontWeight: 700, color: accent }}>{score.overall_score}</span>
        <span style={{ color: C.parchmentDim, fontSize: '1rem' }}>/10</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {DIMENSIONS.map(({ key, label }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span style={{ color: C.parchmentDim, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
            </div>
            <ScoreBar value={score[key] as number} />
          </div>
        ))}
      </div>
      <p style={{ color: C.parchment, fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '0.75rem', borderTop: `1px solid ${C.border}`, paddingTop: '0.75rem' }}>
        {score.summary}
      </p>
      <p style={{ color: accent, fontSize: '0.83rem', lineHeight: 1.5, fontStyle: 'italic' }}>
        {score.personal_note}
      </p>
    </div>
  )
}

function ScoreContent() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [convo, setConvo] = useState<Convo | null>(null)
  const [scores, setScores] = useState<Scores | null>(null)
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('id, topic:topics(title, category), user_a:users!conversations_user_a_id_fkey(username), user_b:users!conversations_user_b_id_fkey(username)')
        .eq('id', id)
        .single()
      if (data) setConvo(data as unknown as Convo)

      // Check if scores already exist
      const res = await fetch(`/api/score?conversationId=${id}`)
      const json = await res.json()
      if (json.scores) setScores(json.scores)
      setLoading(false)
    }
    init()
  }, [id])

  const generateScores = async () => {
    setScoring(true)
    setError('')
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id, transcript }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to score')
      setScores(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scoring failed')
    } finally {
      setScoring(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.parchmentDim }}>Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.ink, color: C.parchment, padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      {convo && (
        <>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5, color: C.lavender }}>
            {convo.topic?.category}
          </span>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', margin: '0.25rem 0 2rem', maxWidth: 640 }}>
            {convo.topic?.title}
          </h1>
        </>
      )}

      {scores ? (
        <>
          <p style={{ color: C.sage, fontSize: '0.85rem', marginBottom: '1.5rem' }}>✦ Conversation scored</p>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <ScoreCard name={convo?.user_a?.username ?? 'Participant A'} score={scores.user_a} accent={C.sage} />
            <ScoreCard name={convo?.user_b?.username ?? 'Participant B'} score={scores.user_b} accent={C.lavender} />
          </div>
          <button
            onClick={() => router.push('/discuss')}
            style={{ marginTop: '2rem', background: C.amber, border: 'none', color: C.ink, padding: '0.65rem 1.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 700 }}
          >
            Find Another Conversation
          </button>
        </>
      ) : (
        <div style={{ maxWidth: 560 }}>
          <p style={{ color: C.parchmentDim, lineHeight: 1.7, marginBottom: '1.25rem' }}>
            Your conversation has ended. Briefly describe what was discussed — key points, arguments, moments of insight — and we&apos;ll score both participants.
          </p>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={`e.g. "${convo?.user_a?.username ?? 'A'} argued that... ${convo?.user_b?.username ?? 'B'} pushed back by pointing out... They agreed on..."`}
            rows={6}
            style={{
              width: '100%', background: C.inkCard, border: `1px solid ${C.border}`, borderRadius: '0.5rem',
              color: C.parchment, padding: '0.85rem', fontSize: '0.9rem', lineHeight: 1.6,
              resize: 'vertical', boxSizing: 'border-box', outline: 'none',
            }}
          />
          {error && <p style={{ color: '#B4564B', marginTop: '0.5rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              onClick={generateScores}
              disabled={scoring}
              style={{
                background: scoring ? C.slate : C.amber, border: 'none', color: C.ink,
                padding: '0.65rem 1.75rem', borderRadius: '0.5rem', cursor: scoring ? 'default' : 'pointer',
                fontWeight: 700, opacity: scoring ? 0.7 : 1,
              }}
            >
              {scoring ? 'Scoring…' : 'Score This Conversation'}
            </button>
            <button
              onClick={() => router.push('/discuss')}
              style={{ background: 'transparent', border: `1px solid ${C.slate}`, color: C.parchmentDim, padding: '0.65rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer' }}
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ScorePage() {
  return (
    <ProtectedRoute>
      <ScoreContent />
    </ProtectedRoute>
  )
}
