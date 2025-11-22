'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export default function TestsPage() {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchUserAndRuns() {
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) {
        router.push('/auth/login')  // Redirect to login if not authenticated
        return
      }
      // Fetch only this user's runs (see below)
      const { data, error } = await supabase
        .from('test_runs')
        .select('id, url, score, created_at')
        .eq('user_id', user.id) // Only their runs!
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) {
        console.error('Error fetching runs:', error)
      } else {
        setRuns(data || [])
      }
      setLoading(false)
    }
    fetchUserAndRuns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-gray-300 text-lg">Loading test runs...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Test Run History</h1>
          <Link href="/">
            <button className="border border-blue-400 text-blue-400 hover:bg-blue-400/10 px-6 py-2 rounded-lg transition">
              New Test
            </button>
          </Link>
        </div>

        {runs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No test runs yet</p>
            <Link href="/">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition">
                Run Your First Test
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    URL
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Score
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    className="hover:bg-slate-700/30 transition"
                  >
                    <td className="px-6 py-4">
                      <a
                        href={run.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition"
                      >
                        {run.url}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          run.score >= 80
                            ? 'bg-green-500/20 text-green-400'
                            : run.score >= 50
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {run.score}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400 text-sm">
                      {new Date(run.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/report/${run.id}`}>
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition">
                          View Report →
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
