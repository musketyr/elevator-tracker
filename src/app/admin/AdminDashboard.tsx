'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface Elevator {
  id: string
  name: string
  location: string | null
  report_count: string
}

interface Admin {
  id: string
  email: string
}

const COLORS = ['#ef4444', '#f97316', '#eab308']
const ISSUE_LABELS: Record<string, string> = {
  stopped_unexpectedly: '🛑 Stopped',
  rumbled_occupied: '📳 Rumbled (Occupied)',
  rumbled_arrival: '⚠️ Rumbled (Arrival)',
}

export default function AdminDashboard({ admin }: { admin: Admin }) {
  const [elevators, setElevators] = useState<Elevator[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMsg, setInviteMsg] = useState('')
  const [selectedElevator, setSelectedElevator] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [statsDays, setStatsDays] = useState(7)
  const [qrData, setQrData] = useState<{ qr: string; url: string } | null>(null)

  const loadElevators = useCallback(async () => {
    const res = await fetch('/api/elevators')
    if (res.ok) setElevators(await res.json())
  }, [])

  useEffect(() => { loadElevators() }, [loadElevators])

  const loadStats = async (id: string, days: number) => {
    const res = await fetch(`/api/elevators/${id}/stats?days=${days}`)
    if (res.ok) setStats(await res.json())
  }

  const loadQR = async (id: string) => {
    const res = await fetch(`/api/elevators/${id}/qr`)
    if (res.ok) setQrData(await res.json())
  }

  useEffect(() => {
    if (selectedElevator) {
      loadStats(selectedElevator, statsDays)
      loadQR(selectedElevator)
    }
  }, [selectedElevator, statsDays])

  const saveElevator = async () => {
    const method = editId ? 'PUT' : 'POST'
    const url = editId ? `/api/elevators/${editId}` : '/api/elevators'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, location }),
    })
    setShowForm(false)
    setEditId(null)
    setName('')
    setLocation('')
    loadElevators()
  }

  const deleteElevator = async (id: string) => {
    if (!confirm('Are you sure?')) return
    await fetch(`/api/elevators/${id}`, { method: 'DELETE' })
    if (selectedElevator === id) setSelectedElevator(null)
    loadElevators()
  }

  const inviteAdmin = async () => {
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail }),
    })
    if (res.ok) {
      setInviteMsg('Invitation sent!')
      setInviteEmail('')
    } else {
      setInviteMsg('Failed to send invite')
    }
    setTimeout(() => setInviteMsg(''), 3000)
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛗</span>
            <h1 className="text-xl font-bold">Elevator Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{admin.email}</span>
            <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Elevator List */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Elevators</h2>
              <button
                onClick={() => { setShowForm(true); setEditId(null); setName(''); setLocation('') }}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
              >+ Add</button>
            </div>

            {showForm && (
              <div className="bg-white rounded-xl p-4 shadow mb-4 space-y-3">
                <input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  placeholder="Location / Building"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <div className="flex gap-2">
                  <button onClick={saveElevator} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm">Save</button>
                  <button onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2 text-sm">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {elevators.map((el) => (
                <div
                  key={el.id}
                  className={`bg-white rounded-xl p-4 shadow cursor-pointer transition-all ${selectedElevator === el.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
                  onClick={() => setSelectedElevator(el.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{el.name}</h3>
                      {el.location && <p className="text-sm text-gray-500">{el.location}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{el.report_count} reports</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditId(el.id); setName(el.name); setLocation(el.location || ''); setShowForm(true) }}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >✏️</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteElevator(el.id) }}
                        className="text-gray-400 hover:text-red-500 text-sm"
                      >🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
              {elevators.length === 0 && (
                <p className="text-gray-400 text-center py-8">No elevators yet</p>
              )}
            </div>

            {/* Invite Admin */}
            <div className="mt-8 bg-white rounded-xl p-4 shadow">
              <h3 className="font-medium mb-3">Invite Admin</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="admin@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <button onClick={inviteAdmin} className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm">Invite</button>
              </div>
              {inviteMsg && <p className="text-sm text-green-600 mt-2">{inviteMsg}</p>}
            </div>
          </div>

          {/* Stats & QR */}
          <div className="lg:col-span-2">
            {selectedElevator && stats ? (
              <div className="space-y-6">
                {/* QR Code */}
                {qrData && (
                  <div className="bg-white rounded-xl p-6 shadow">
                    <h3 className="font-semibold mb-4">QR Code</h3>
                    <div className="flex items-start gap-6">
                      <div className="text-center">
                        <img src={qrData.qr} alt="QR Code" className="w-48 h-48" />
                        <p className="text-xs text-gray-400 mt-2 break-all">{qrData.url}</p>
                      </div>
                      <div className="space-y-3">
                        <a
                          href={qrData.qr}
                          download={`elevator-qr-${selectedElevator}.png`}
                          className="block bg-blue-500 text-white px-4 py-2 rounded-lg text-sm text-center hover:bg-blue-600"
                        >Download QR</a>
                        <button
                          onClick={() => {
                            const w = window.open('', '_blank')
                            if (w) {
                              w.document.write(`
                                <html><head><title>Elevator QR</title><style>
                                  body { font-family: sans-serif; text-align: center; padding: 40px; }
                                  .qr { width: 300px; height: 300px; }
                                  h1 { font-size: 28px; margin-top: 20px; }
                                  p { color: #666; margin-top: 10px; }
                                </style></head><body>
                                <img src="${qrData.qr}" class="qr" />
                                <h1>Problem? Scan!</h1>
                                <p>${qrData.url}</p>
                                <script>setTimeout(() => window.print(), 500)</script>
                                </body></html>
                              `)
                            }
                          }}
                          className="block bg-gray-500 text-white px-4 py-2 rounded-lg text-sm text-center hover:bg-gray-600 w-full"
                        >Print QR Page</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="bg-white rounded-xl p-6 shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Reports ({stats.total} total)</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStatsDays(7)}
                        className={`px-3 py-1 rounded-lg text-sm ${statsDays === 7 ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                      >7 days</button>
                      <button
                        onClick={() => setStatsDays(30)}
                        className={`px-3 py-1 rounded-lg text-sm ${statsDays === 30 ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                      >30 days</button>
                    </div>
                  </div>

                  {stats.timeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats.timeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(v: string) => v.substring(5)} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No reports in this period</p>
                  )}
                </div>

                {/* Breakdown */}
                {stats.breakdown.length > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow">
                    <h3 className="font-semibold mb-4">Issue Breakdown</h3>
                    <div className="flex items-center gap-8">
                      <ResponsiveContainer width={200} height={200}>
                        <PieChart>
                          <Pie data={stats.breakdown} dataKey="count" nameKey="issue_type" cx="50%" cy="50%" outerRadius={80}>
                            {stats.breakdown.map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {stats.breakdown.map((b: any, i: number) => (
                          <div key={b.issue_type} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-sm">{ISSUE_LABELS[b.issue_type] || b.issue_type}: {b.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p>Select an elevator to view stats</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
