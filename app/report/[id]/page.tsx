'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export default function ReportPage() {
  const params = useParams()
  const id = params?.id as string

  const [run, setRun] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const copyLink = () => {
  navigator.clipboard.writeText(window.location.href)
  alert('Report link copied!')
}
  useEffect(() => {
    async function fetchRun() {
      if (!id) return
    

      const { data, error } = await supabase
        .from('test_runs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching run:', error)
      } else {
        setRun(data)
      }
      setLoading(false)
    }

    fetchRun()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-gray-300 text-lg">Loading report...</p>
      </div>
    )
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300 text-lg mb-4">Report not found</p>
          <Link href="/dashboard/tests">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition">
              View All Tests
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const results = run.results || []
  const passed = results.filter((r: any) => r.status === 'passed').length
  const failed = results.filter((r: any) => r.status === 'failed').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Test Report</h1>
          <Link href="/dashboard/tests">
            <button className="border border-blue-400 text-blue-400 hover:bg-blue-400/10 px-6 py-2 rounded-lg transition">
              All Tests
            </button>
          </Link>
        </div>
        <div className="flex justify-between items-center mb-8">
  <h1 className="text-4xl font-bold text-white">Test Report</h1>
  <div className="space-x-4">
    <button
      onClick={copyLink}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
    >
      Copy Link
    </button>
    <Link href="/dashboard/tests">
      <button className="border border-blue-400 text-blue-400 hover:bg-blue-400/10 px-6 py-2 rounded-lg transition">
        All Tests
      </button>
    </Link>
  </div>
</div>

        {/* Score Card */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 mb-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-sm text-gray-400 uppercase tracking-wide mb-2">
                MVP Quality Score
              </p>
              <p
                className={`text-5xl font-bold ${
                  run.score >= 80
                    ? 'text-green-400'
                    : run.score >= 50
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}
              >
                {run.score}/100
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400 uppercase tracking-wide mb-2">
                Tests Passed
              </p>
              <p className="text-5xl font-bold text-green-400">{passed}</p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400 uppercase tracking-wide mb-2">
                Tests Failed
              </p>
              <p className="text-5xl font-bold text-red-400">{failed}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">URL:</span>
              <a
                href={run.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                {run.url}
              </a>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-400">Date:</span>
              <span className="text-white">
                {new Date(run.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <h2 className="text-2xl font-bold text-white mb-4">Test Results</h2>
        <div className="space-y-3">
          {results.map((r: any, i: number) => (
            <div
              key={i}
              className="border border-slate-700 rounded-lg px-6 py-4 bg-slate-800/50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-400 uppercase">
                    {r.category} • {r.priority}
                  </span>
                  <p className="text-white font-medium mt-1">{r.testName}</p>
                  {r.error && (
                    <p className="text-xs text-red-400 mt-2">Error: {r.error}</p>
                  )}
                </div>
                <span
                  className={`text-sm font-semibold ${
                    r.status === 'passed' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {r.status === 'passed' ? '✓ PASSED' : '✗ FAILED'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
