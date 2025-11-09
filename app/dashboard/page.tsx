'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Test {
  id: string
  target_url: string
  status: string
  completion_rate: number | null
  created_at: string
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState<Test[]>([])
  const [url, setUrl] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchTests()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
    } else {
      setUser(user)
      setLoading(false)
    }
  }

  const fetchTests = async () => {
    const { data } = await supabase
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (data) setTests(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const runTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRunning(true)

    try {
      // Insert test record
      const { data: test, error } = await supabase
        .from('tests')
        .insert({
          user_id: user.id,
          target_url: url,
          status: 'running'
        })
        .select()
        .single()

      if (error) throw error

      // Call API to run test (we'll create this next)
      const response = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: test.id, url })
      })

      if (response.ok) {
        alert('Test started! Check back in a few minutes.')
        setUrl('')
        fetchTests()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to start test')
    } finally {
      setIsRunning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/50 backdrop-blur border-b border-slate-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            AI MVP Tester
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Run New Test */}
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Run New Test</h2>
          <p className="text-gray-400 mb-6">
            Enter your landing page URL and AI personas will test it automatically
          </p>

          <form onSubmit={runTest} className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-landing-page.com"
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition disabled:opacity-50 whitespace-nowrap"
            >
              {isRunning ? 'Starting...' : 'Run Test'}
            </button>
          </form>
        </div>

        {/* Test History */}
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Tests</h2>

          {tests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🚀</div>
              <p className="text-gray-400 text-lg">No tests yet. Run your first test above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-blue-500 transition cursor-pointer"
                  onClick={() => router.push(`/dashboard/results/${test.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">{test.target_url}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(test.created_at).toLocaleDateString()} at{' '}
                        {new Date(test.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {test.completion_rate !== null && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-400">
                            {test.completion_rate}%
                          </p>
                          <p className="text-xs text-gray-400">Completion</p>
                        </div>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          test.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : test.status === 'running'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {test.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
