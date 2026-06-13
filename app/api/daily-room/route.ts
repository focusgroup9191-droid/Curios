import { NextRequest, NextResponse } from 'next/server'

const DAILY_API = 'https://api.daily.co/v1'

export async function POST(req: NextRequest) {
  const apiKey = process.env.DAILY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Daily API key not configured' }, { status: 500 })
  }

  let body: { conversationId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const conversationId = body.conversationId
  if (!conversationId || typeof conversationId !== 'string') {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
  }

  // Deterministic, URL-safe room name shared by both participants.
  // NOTE (v2 hardening): verify the caller is actually a participant in this
  // conversation, and switch privacy to 'private' with meeting tokens before launch.
  const roomName = `curios-${conversationId.replace(/-/g, '')}`

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  try {
    const createRes = await fetch(`${DAILY_API}/rooms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: roomName,
        privacy: 'public',
        properties: {
          start_audio_off: true,
          start_video_off: true,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2,
          eject_at_room_exp: true,
        },
      }),
    })

    if (createRes.ok) {
      const room = await createRes.json()
      return NextResponse.json({ url: room.url, name: room.name })
    }

    // Room likely already created by the other participant — fetch it instead.
    if (createRes.status === 400 || createRes.status === 409) {
      const getRes = await fetch(`${DAILY_API}/rooms/${roomName}`, { headers })
      if (getRes.ok) {
        const room = await getRes.json()
        return NextResponse.json({ url: room.url, name: room.name })
      }
    }

    const errText = await createRes.text()
    return NextResponse.json({ error: `Daily error: ${errText}` }, { status: 502 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create room' },
      { status: 500 },
    )
  }
}
