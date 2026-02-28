import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
}

export async function POST(req: NextRequest) {
  const genAI = getGenAI()
  try {
    const { message, role, context } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const userRole = role || 'citizen'

    const systemPrompt = `You are AI Samajh's assistant — a helpful AI that explains AI news to Indians.
The user's role: ${userRole}.
${context ? `Article context: ${context}` : ''}

Rules:
- Keep answers concise (2-4 sentences).
- Use simple language a ${userRole} would understand.
- Reference Indian context when relevant (Indian companies, policies, DPDP Act, etc.).
- If asked about something unrelated to AI/tech, politely redirect.`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: message },
    ])

    const response = result.response
    const text = response.text()

    return NextResponse.json({ reply: text })
  } catch (error: unknown) {
    console.error('Chat API error:', error)
    const errMsg = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
