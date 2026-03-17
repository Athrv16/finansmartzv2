/* -------------------------------------------------------------------------- */
// FILE: app/api/assistant/route.js (Next.js App Router). Copy into app/api/assistant/route.js

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/prisma'

export async function POST(req) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const msgs = body.messages || []

    const chatMessages = msgs.map(m => ({ role: m.role === 'user' ? 'user' : m.role === 'assistant' ? 'assistant' : 'system', content: m.content }))

    const investmentGuardrails = [
      "When discussing investment recommendations, first check for income/savings anomalies (e.g., negative savings rate) and ask the user to fix data before trusting recommendations.",
      "If the user is in India, avoid US-only ETFs (e.g., VTI, SCHD, BND) and suggest Indian equivalents such as Nifty 50 Index Funds, HDFC Dividend Yield Fund, or Bharat Bond ETF.",
      "For moderate risk, a 60% equity / 30% debt / 10% others allocation is a classic balanced portfolio.",
      "Encourage building an emergency fund of 3–6 months of expenses before investing.",
    ].join(" ");

    const systemPrompt = {
      role: "system",
      content: investmentGuardrails,
    };

    const OPENAI_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_KEY) return NextResponse.json({ error: 'Missing OPENAI_API_KEY env var' }, { status: 500 })

    const payload = {
      model: 'gpt-4o-mini',
      messages: [systemPrompt, ...chatMessages],
      temperature: 0.2,
      max_tokens: 800,
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!r.ok) {
      const text = await r.text()
      return NextResponse.json({ error: text }, { status: r.status })
    }

    const data = await r.json()
    const assistantReply = data.choices?.[0]?.message?.content || data.choices?.[0]?.message || null

    // Save assistant response to database
    if (assistantReply) {
      // Find the user in the database using clerkUserId
      const user = await db.user.findUnique({
        where: { clerkUserId: userId },
      })
      if (user) {
        await db.chatMessage.create({
          data: {
            userId: user.id,
            role: 'assistant',
            content: assistantReply,
          },
        })
      }
    }

    return NextResponse.json({ response: assistantReply })
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

