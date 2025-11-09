'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface TestResult {
  id: string
  persona_name: string
  persona_description: string
  completed: boolean
  abandon_reason: string | null
  steps: string[]
}

interface Test {
  id: string
  target_url: string
  status: string
  completion_rate: number | null
  created_at: string
}

export default function TestResults() {
  const params = useParams()
  const router = useRouter()
  const [test, setTest] = useState<Test | null>(null)
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTestData()
  }, [])

  const fetchTestData = async () => {
    const testId = params.testId as string

    // Fetch test
    const { data: testData } = await supabase
      .from('tests')
      .select('*')
      .eq('id', testId)
      .single()

    // Fetch results
    const { data: resultsData } = await supabase
      .from('test_results')
      .select('*')
      .eq('test_id', testId)

    setTest(testData)
    setResults(resultsData || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading results...</div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Test not found</div>
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
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Test Summary */}
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Test Results</h1>
          <p className="text-gray-400 mb-6">{test.target_url}</p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-700/50 rounded-lg p-6">
              <p className="text-gray-400 mb-2">Completion Rate</p>
              <p className="text-4xl font-bold text-blue-400">
                {test.completion_rate || 0}%
              </p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-6">
              <p className="text-gray-400 mb-2">Status</p>
              <p className="text-2xl font-bold text-white capitalize">{test.status}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-6">
              <p className="text-gray-400 mb-2">Tested</p>
              <p className="text-lg text-white">
                {new Date(test.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Persona Results */}
        <div className="space-y-6">
          {results.map((result) => (
            <div
              key={result.id}
              className="bg-slate-800 rounded-xl p-8 border border-slate-700"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {result.persona_name}
                  </h3>
                  <p className="text-gray-400">{result.persona_description}</p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full font-semibold ${
                    result.completed
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {result.completed ? '✓ Completed' : '✗ Abandoned'}
                </span>
              </div>

              {!result.completed && result.abandon_reason && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
                  <p className="text-red-400 font-semibold mb-1">Why they left:</p>
                  <p className="text-red-300">{result.abandon_reason}</p>
                </div>
              )}

              <div>
                <p className="text-gray-400 font-semibold mb-3">User Journey:</p>
                <ol className="space-y-2">
                  {result.steps.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="text-blue-400 font-semibold">{index + 1}.</span>
                      <span className="text-gray-300">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
