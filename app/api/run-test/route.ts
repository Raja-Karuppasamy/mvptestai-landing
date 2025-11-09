import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// AI Personas
const personas = [
  {
    name: 'Sarah (Tech-Anxious)',
    description: 'Non-technical user, easily confused by jargon, needs simple instructions',
  },
  {
    name: 'Marcus (Impatient)',
    description: 'Busy professional, wants immediate value, abandons if too slow',
  },
  {
    name: 'Linda (Detail-Oriented)',
    description: 'Thorough researcher, reads everything, needs clear information',
  },
]

export async function POST(req: NextRequest) {
  try {
    const { testId, url } = await req.json()

    // Run tests for each persona
    const results = await Promise.all(
      personas.map((persona) => runPersonaTest(persona, url))
    )

    // Calculate completion rate
    const completedCount = results.filter((r) => r.completed).length
    const completionRate = Math.round((completedCount / results.length) * 100)

    // Save results to database
    for (const result of results) {
      await supabase.from('test_results').insert({
        test_id: testId,
        persona_name: result.persona_name,
        persona_description: result.persona_description,
        completed: result.completed,
        abandon_reason: result.abandon_reason,
        steps: result.steps,
      })
    }

    // Update test status
    await supabase
      .from('tests')
      .update({
        status: 'completed',
        completion_rate: completionRate,
      })
      .eq('id', testId)

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}

async function runPersonaTest(persona: any, url: string) {
  try {
    const prompt = `You are ${persona.name}: ${persona.description}

You're visiting this landing page: ${url}

Analyze the page from your persona's perspective and provide:
1. Would you complete the signup/action? (yes/no)
2. If no, why would you abandon? Be specific.
3. List 3-5 key steps you took while browsing
4. Rate clarity (1-10)
5. Rate value proposition (1-10)

Respond in JSON format:
{
  "completed": true/false,
  "abandon_reason": "reason if abandoned",
  "steps": ["step1", "step2", "step3"],
  "clarity_score": 8,
  "value_score": 9
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')

    return {
      persona_name: persona.name,
      persona_description: persona.description,
      completed: result.completed,
      abandon_reason: result.abandon_reason || null,
      steps: result.steps || [],
    }
  } catch (error) {
    console.error(`Error testing ${persona.name}:`, error)
    return {
      persona_name: persona.name,
      persona_description: persona.description,
      completed: false,
      abandon_reason: 'Test failed',
      steps: [],
    }
  }
}
