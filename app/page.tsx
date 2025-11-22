'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  // Auth state
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard/tests')
    } else {
      router.push('/auth/signup')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  // Waitlist state
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Test plan state
  const [testUrl, setTestUrl] = useState('')
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testPlan, setTestPlan] = useState<any | null>(null)
  const [runResults, setRunResults] = useState<any[] | null>(null)
  const [running, setRunning] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [failureGroups, setFailureGroups] = useState<any | null>(null)

  // Waitlist handler
  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setEmail('')
    setTimeout(() => setSubmitted(false), 3000)
  }

  // Generate test plan handler
  const handleGenerateTestPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setTestPlan(null)

    try {
      const res = await fetch('/api/create-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl, instructions }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        setTestPlan(data.testPlan)
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  // Run test plan handler
  const handleRunPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setRunning(true)
    setError(null)
    setRunResults(null)

    try {
      // Get current session and access token
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      // Call /api/run-plan with Authorization header
      const res = await fetch('/api/run-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ url: testUrl, instructions }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Run failed')
      } else {
        setTestPlan(data.plan)
        setRunResults(data.results)
        setScore(data.score)
        setFailureGroups(data.failureGroups)
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4 bg-slate-900/50 backdrop-blur border-b border-slate-700">
        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
          AI MVP Tester
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={handleGetStarted}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            {user ? 'Dashboard' : 'Get Started'}
          </button>
          <Link href="/dashboard/tests">
            <button className="border border-blue-400 text-blue-400 hover:bg-blue-400/10 px-6 py-2 rounded-lg transition">
              View Test History
            </button>
          </Link>
          {user ? (
            <span className="ml-4 text-gray-400">
              {user.email}{' '}
              <button onClick={handleLogout} className="ml-2 text-blue-400 underline">
                Logout
              </button>
            </span>
          ) : null}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Test Your Web App Like{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Real Users
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          AI-powered personas test your landing pages, spot UX issues, and give actionable
          recommendations—all automatically. Stop guessing how users experience your app.
        </p>
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button
            onClick={handleGetStarted}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition transform hover:scale-105 shadow-lg"
          >
            {user ? 'Go to Dashboard' : 'Start Free Trial'}
          </button>
          <button className="border-2 border-blue-400 text-blue-400 hover:bg-blue-400/10 px-8 py-4 rounded-lg font-semibold text-lg transition">
            Watch Demo
          </button>
        </div>
        {/* Demo Placeholder */}
        <div className="bg-slate-800 rounded-xl overflow-hidden mb-16 aspect-video max-w-4xl mx-auto flex items-center justify-center border border-slate-700 shadow-2xl">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">▶️</div>
            <p className="text-xl text-gray-300 font-semibold">Watch AI Testing Your Landing Page</p>
            <p className="text-gray-500 mt-2">2-minute demo</p>
          </div>
        </div>
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 hover:border-blue-500 transition">
            <div className="text-4xl font-bold text-blue-400 mb-2">3x</div>
            <p className="text-gray-300">More UX issues found vs manual testing</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 hover:border-cyan-500 transition">
            <div className="text-4xl font-bold text-cyan-400 mb-2">5min</div>
            <p className="text-gray-300">Get full test report with insights</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 hover:border-blue-500 transition">
            <div className="text-4xl font-bold text-blue-400 mb-2">AI</div>
            <p className="text-gray-300">Real persona decision-making</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-700">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Why AI MVP Tester?
        </h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="text-5xl">🤖</div>
            <h3 className="text-2xl font-bold text-white">Real User Personas</h3>
            <p className="text-gray-400 leading-relaxed">
              Sarah is anxious about tech. Marcus wants fast results. Linda needs simple instructions.
              Your app gets tested from their real perspectives.
            </p>
          </div>
          <div className="space-y-4">
            <div className="text-5xl">📊</div>
            <h3 className="text-2xl font-bold text-white">Actionable Insights</h3>
            <p className="text-gray-400 leading-relaxed">
              Get specific recommendations, not just pass/fail metrics. AI analyzes *why* users abandon
              and *what to fix*.
            </p>
          </div>
          <div className="space-y-4">
            <div className="text-5xl">⚡</div>
            <h3 className="text-2xl font-bold text-white">Lightning Fast</h3>
            <p className="text-gray-400 leading-relaxed">
              Test your entire landing page in 5 minutes. Get results instantly. No setup,
              no coding knowledge needed.
            </p>
          </div>
          <div className="space-y-4">
            <div className="text-5xl">🔄</div>
            <h3 className="text-2xl font-bold text-white">Continuous Testing</h3>
            <p className="text-gray-400 leading-relaxed">
              Schedule automated tests nightly. Track improvements over time. Catch regressions
              before users do.
            </p>
          </div>
          <div className="space-y-4">
            <div className="text-5xl">🎯</div>
            <h3 className="text-2xl font-bold text-white">Custom Personas</h3>
            <p className="text-gray-400 leading-relaxed">
              Create personas specific to your audience. Tech founders? Non-technical?
              Mobile-first? We adapt.
            </p>
          </div>
          <div className="space-y-4">
            <div className="text-5xl">📈</div>
            <h3 className="text-2xl font-bold text-white">Boost Conversions</h3>
            <p className="text-gray-400 leading-relaxed">
              Teams using AI MVP Tester see 15-25% improvement in conversion rates after
              implementing recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-700">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Simple Pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-blue-500 transition">
            <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
            <p className="text-gray-400 mb-6">Perfect for indie developers</p>
            <div className="text-5xl font-bold text-white mb-6">
              $29<span className="text-lg text-gray-400">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 text-gray-300">
              <li>✅ 5 tests per month</li>
              <li>✅ 3 default personas</li>
              <li>✅ Email reports</li>
              <li>❌ Custom personas</li>
            </ul>
            <button className="w-full border border-blue-400 text-blue-400 hover:bg-blue-400/10 py-3 rounded-lg transition font-semibold">
              Start Free Trial
            </button>
          </div>
          {/* Professional */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-8 relative scale-105 shadow-2xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 mt-6">Professional</h3>
            <p className="text-blue-100 mb-6">Best for growing teams</p>
            <div className="text-5xl font-bold text-white mb-6">
              $99<span className="text-lg text-blue-100">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 text-white">
              <li>✅ 50 tests per month</li>
              <li>✅ All personas</li>
              <li>✅ 3 custom personas</li>
              <li>✅ Slack notifications</li>
              <li>✅ Priority support</li>
            </ul>
            <button className="w-full bg-white text-blue-600 hover:bg-gray-100 py-3 rounded-lg font-semibold transition">
              Get Started
            </button>
          </div>
          {/* Enterprise */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-blue-500 transition">
            <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
            <p className="text-gray-400 mb-6">For organizations</p>
            <div className="text-5xl font-bold text-white mb-6">
              $499<span className="text-lg text-gray-400">/mo</span>
            </div>
            <ul className="space-y-3 mb-8 text-gray-300">
              <li>✅ Unlimited tests</li>
              <li>✅ Unlimited personas</li>
              <li>✅ API access</li>
              <li>✅ Team management</li>
              <li>✅ Dedicated support</li>
            </ul>
            <button className="w-full border border-blue-400 text-blue-400 hover:bg-blue-400/10 py-3 rounded-lg transition font-semibold">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Generate Test Plan (MVP testing form) */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-slate-700">
        <h2 className="text-3xl font-bold text-white mb-4 text-center">
          Generate an AI Test Plan
        </h2>
        <p className="text-gray-300 mb-8 text-center">
          Paste your MVP URL and let AI create a full test plan (flows, UX, performance, accessibility, security).
        </p>

        <form
          onSubmit={handleGenerateTestPlan}
          className="space-y-4 max-w-xl mx-auto"
        >
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              MVP URL
            </label>
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://your-app.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              What should we test? (optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Test signup, login and dashboard on mobile"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 h-28"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-semibold transition shadow-lg"
            >
              {loading ? 'Generating test plan…' : 'Generate Test Plan'}
            </button>
            <button
              type="button"
              disabled={running || !testUrl}
              onClick={handleRunPlan}
              className="w-full sm:w-1/2 border border-blue-400 text-blue-400 hover:bg-blue-400/10 disabled:opacity-50 px-8 py-3 rounded-lg font-semibold transition"
            >
              {running ? 'Running tests…' : 'Run Tests & Get Results'}
            </button>
          </div>
        </form>
        {score !== null && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400 uppercase tracking-wide">
              MVP Quality Score
            </p>
            <p className="text-4xl font-bold text-white">
              {score}/100
            </p>
          </div>
        )}
        {failureGroups?.critical?.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-red-400 mb-2">
              Critical issues to fix first
            </h4>
            <ul className="space-y-1 text-sm text-gray-300">
              {failureGroups.critical.map((t: any, i: number) => (
                <li key={i}>• {t.testName}</li>
              ))}
            </ul>
          </div>
        )}
        {runResults && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-white mb-3">
              Test Run Results
            </h3>
            <div className="space-y-2">
              {runResults.map((r, i) => (
                <div
                  key={i}
                  className="border border-slate-700 rounded-lg px-4 py-3 bg-slate-900/60"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">
                      {r.category.toUpperCase()} • {r.priority.toUpperCase()}
                    </span>
                    <span
                      className={
                        r.status === 'passed'
                          ? 'text-green-400 text-sm font-semibold'
                          : 'text-red-400 text-sm font-semibold'
                      }
                    >
                      {r.status === 'passed' ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <div className="mt-1 text-white font-medium">
                    {r.testName}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    Duration: {r.durationMs} ms
                  </div>
                  {r.error && (
                    <div className="mt-1 text-xs text-red-400">
                      Error: {r.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-400 text-center">
            {error}
          </p>
        )}
        {testPlan && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-white mb-3">
              Generated Test Plan (JSON preview)
            </h3>
            <pre className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-xs text-gray-100 overflow-auto max-h-96">
              {JSON.stringify(testPlan, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center border-t border-slate-700">
        <h2 className="text-4xl font-bold text-white mb-6">
          Ready to Improve Your UX?
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Get instant AI-powered testing insights. 14-day free trial, no credit card needed.
        </p>
        <form
          onSubmit={handleWaitlist}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition whitespace-nowrap shadow-lg"
          >
            {submitted ? '✅ Sent!' : 'Get Free Trial'}
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 px-6 text-center text-gray-500">
        <p>© 2025 AI MVP Tester. All rights reserved.</p>
        <div className="mt-4 space-x-6">
          <a href="#" className="hover:text-white transition">
            Privacy
          </a>
          <a href="#" className="hover:text-white transition">
            Terms
          </a>
          <a href="#" className="hover:text-white transition">
            Contact
          </a>
        </div>
      </footer>
    </div>
  )
}
