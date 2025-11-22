import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateTestPlan } from '../../../agent-planner.js';
import { executeTestPlan } from '../../../test-executor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for backend auth
);

function computeScore(results: any[]): number {
  if (!results.length) return 0;

  const weights: Record<string, number> = {
    critical: 3,
    high: 2,
    medium: 1,
    low: 1,
  };

  let total = 0;
  let possible = 0;

  for (const r of results) {
    const w = weights[r.priority?.toLowerCase()] || 1;
    possible += w;
    if (r.status === 'passed') total += w;
  }

  if (!possible) return 0;
  return Math.round((total / possible) * 100);
}

function groupFailures(results: any[]) {
  const critical: any[] = [];
  const high: any[] = [];
  const medium: any[] = [];
  const low: any[] = [];

  for (const r of results) {
    if (r.status !== 'failed') continue;
    const p = r.priority?.toLowerCase() || 'medium';
    if (p === 'critical') critical.push(r);
    else if (p === 'high') high.push(r);
    else if (p === 'medium') medium.push(r);
    else low.push(r);
  }

  return { critical, high, medium, low };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Get Authorization header and extract access token
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    // 2. Get user from Supabase using the access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // 3. Parse request body
    const { url, instructions } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 4. Generate test plan
    const plan = await generateTestPlan(url, instructions);

    // 5. Execute test plan
    const { results } = await executeTestPlan(url, plan);

    // 6. Compute score and group failures
    const score = computeScore(results);
    const failureGroups = groupFailures(results);

    // 7. Insert test run with user_id
    const { data, error } = await supabase
      .from('test_runs')
      .insert({
        url,
        plan,
        results,
        score,
        user_id: user.id, // Link to the authenticated user
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save test run' }, { status: 500 });
    }

    // 8. Return results
    return NextResponse.json({ plan, results, score, failureGroups, run: data });
  } catch (err: any) {
    console.error('Run plan error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
