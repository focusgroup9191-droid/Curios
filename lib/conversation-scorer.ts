import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export interface UserScore {
  depth_of_thought: number
  clarity: number
  active_listening: number
  use_of_evidence: number
  open_mindedness: number
  overall_score: number
  summary: string
  personal_note: string
}

export interface ScorerResult {
  user_a: UserScore
  user_b: UserScore
}

export async function scoreConversation(
  topic: string,
  userAName: string,
  userBName: string,
  transcript: string
): Promise<ScorerResult> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: `You are an intellectual conversation evaluator. Score each participant on 5 dimensions (1-10):
- depth_of_thought: How deeply they engaged with the topic
- clarity: How clearly they expressed their ideas
- active_listening: How well they responded to the other person's points
- use_of_evidence: How well they supported claims with reasoning or evidence
- open_mindedness: How willing they were to consider other perspectives

Also provide:
- overall_score: An aggregate score (1-10)
- summary: A 1-2 sentence summary of their performance
- personal_note: A specific, encouraging note about something they did well or could improve

Respond with STRICT JSON ONLY. No markdown, no commentary. Format:
{
  "user_a": { "depth_of_thought": N, "clarity": N, "active_listening": N, "use_of_evidence": N, "open_mindedness": N, "overall_score": N, "summary": "...", "personal_note": "..." },
  "user_b": { "depth_of_thought": N, "clarity": N, "active_listening": N, "use_of_evidence": N, "open_mindedness": N, "overall_score": N, "summary": "...", "personal_note": "..." }
}`,
    messages: [
      {
        role: 'user',
        content: `Topic: ${topic}

Participants:
- user_a is ${userAName}
- user_b is ${userBName}

Transcript:
${transcript}

Score this conversation.`,
      },
    ],
  })

  const text = response.content.find((b) => b.type === 'text')?.text ?? ''
  return JSON.parse(text) as ScorerResult
}
