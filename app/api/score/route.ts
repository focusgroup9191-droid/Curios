import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scoreConversation } from '@/lib/conversation-scorer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  let body: { conversationId?: string; transcript?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { conversationId, transcript } = body
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId required' }, { status: 400 })
  }

  // Fetch conversation with topic and users
  const { data: convo, error } = await supabase
    .from('conversations')
    .select('id, topic:topics(title), user_a:users!conversations_user_a_id_fkey(username), user_b:users!conversations_user_b_id_fkey(username)')
    .eq('id', conversationId)
    .single()

  if (error || !convo) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const topic = (convo.topic as { title: string } | null)?.title ?? 'Unknown topic'
  const userAName = (convo.user_a as { username: string } | null)?.username ?? 'Participant A'
  const userBName = (convo.user_b as { username: string } | null)?.username ?? 'Participant B'
  const text = transcript?.trim() || `A conversation between ${userAName} and ${userBName} about: ${topic}`

  const result = await scoreConversation(topic, userAName, userBName, text)

  // Store scores (upsert so second user sees same results)
  await supabase.from('conversation_scores').upsert(
    {
      conversation_id: conversationId,
      user_a_score: result.user_a,
      user_b_score: result.user_b,
    },
    { onConflict: 'conversation_id' }
  )

  return NextResponse.json(result)
}

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get('conversationId')
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('conversation_scores')
    .select('user_a_score, user_b_score')
    .eq('conversation_id', conversationId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ scores: null })
  return NextResponse.json({ scores: { user_a: data.user_a_score, user_b: data.user_b_score } })
}
