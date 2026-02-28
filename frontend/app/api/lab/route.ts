import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

export async function POST(req: NextRequest) {
  try {
    const { text, question, role } = await req.json()

    if (!text || !question) {
      return NextResponse.json(
        { error: 'Both text and question are required' },
        { status: 400 }
      )
    }

    const userRole = role || 'citizen'

    const prompt = `You are AI Samajh Lab — an AI analysis tool for Indian users.

User role: ${userRole}
User pasted this text:
"""
${text.slice(0, 3000)}
"""

User's question: ${question}

Respond with a structured JSON object (no markdown code fences):
{
  "summary": "2-3 sentence summary of the text",
  "answer": "Direct answer to the user's question (3-5 sentences)",
  "category": "research | product | funding | regulation | opinion",
  "credibility_estimate": 50,
  "key_points": ["point 1", "point 2", "point 3"],
  "relevance_note": "Why this matters for a ${userRole} in India"
}`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Try to parse as JSON
    try {
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned)
      return NextResponse.json({ result: parsed })
    } catch {
      // Return raw text if JSON parsing fails
      return NextResponse.json({ result: { answer: responseText } })
    }
  } catch (error: unknown) {
    console.error('Lab API error:', error)
    const errMsg = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
