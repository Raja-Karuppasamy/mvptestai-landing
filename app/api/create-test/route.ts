import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateTestPlan } from '../../../agent-planner.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // --- AUTHORIZATION CHECK ---
    const authHeader = req.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    if (!user || userError) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    // --- REQUEST BODY PARSING ---
    let body
    try {
      body = await req.json()
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { url, instructions } = body
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // --- RUN TEST PLAN GENERATION ---
    console.log('🔍 Generating test plan for:', url)
    const testPlan = await generateTestPlan(url, instructions)
    console.log('✅ Test plan generated successfully')

    return NextResponse.json({ testPlan })
  } catch (error: any) {
    console.error('❌ Test plan generation failed:', error)
    return NextResponse.json(
      { error: 'Test plan generation failed', details: error.message },
      { status: 500 }
    )
  }
}
