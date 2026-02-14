'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { t, Lang, languages, languageNames } from '@/lib/i18n'

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

const ISSUES = [
  { key: 'stopped_unexpectedly', icon: '🛑', color: 'bg-red-500', labelKey: 'stoppedUnexpectedly' },
  { key: 'rumbled_occupied', icon: '📳', color: 'bg-orange-500', labelKey: 'rumbledOccupied' },
  { key: 'rumbled_arrival', icon: '⚠️', color: 'bg-yellow-500', labelKey: 'rumbledArrival' },
]

function ReportPreview({ elevator, previewLang }: { elevator: Elevator; previewLang: Lang }) {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-2xl p-6 max-w-sm mx-auto">
      <div className="flex justify-end mb-2">
        <span className="text-xs bg-white border rounded-lg px-2 py-1 text-gray-500">{languageNames[previewLang]}</span>
      </div>
      <div className="text-center mb-6">
        <p className="text-4xl mb-2">🛗</p>
        <h3 className="text-xl font-bold text-gray-800">{elevator.name}</h3>
        {elevator.location && <p className="text-gray-500 text-sm mt-1">{elevator.location}</p>}
        <div className="mt-3 bg-blue-500 text-white rounded-2xl py-2.5 px-5 inline-block shadow-lg">
          <p className="text-sm font-semibold">{t(previewLang, 'problemScan')}</p>
        </div>
      </div>
      <p className="text-center text-sm font-medium text-gray-600 mb-3">{t(previewLang, 'reportIssue')}</p>
      <div className="space-y-3">
        {ISSUES.map((issue) => (
          <div
            key={issue.key}
            className={`w-full ${issue.color} text-white rounded-2xl py-4 px-5 flex items-center gap-3 shadow-lg cursor-default`}
          >
            <span className="text-3xl">{issue.icon}</span>
            <span className="text-lg font-semibold">{t(previewLang, issue.labelKey)}</span>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-gray-400 mt-4 italic">Preview only — buttons do not submit reports</p>
    </div>
  )
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
  const [activeTab, setActiveTab] = useState<'stats' | 'preview' | 'qr'>('stats')
  const [previewLang, setPreviewLang] = useState<Lang>('en')
  const [loading, setLoading] = useState(false)

  const loadElevators = useCallback(async () => {
    const res = await fetch('/api/elevators')
    if (res.ok) setElevators(await res.json())
  }, [])

  useEffect(() => { loadElevators() }, [loadElevators])

  const loadStats = async (id: string, days: number) => {
    setLoading(true)
    const res = await fetch(`/api/elevators/${id}/stats?days=${days}`)
    if (res.ok) setStats(await res.json())
    setLoading(false)
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

  const selectedEl = elevators.find(e => e.id === selectedElevator)

  const printQR = () => {
    if (!qrData || !selectedEl) return
    const allProblemScan = languages.map(l => `<p style="font-size:18px;margin:4px 0;color:#334155;">${t(l, 'problemScan')}</p>`).join('')
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(`<!DOCTYPE html><html><head><title>Elevator QR</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f1f5f9; }
  @media print { body { background: white; } .card { box-shadow: none !important; border: 2px solid #e2e8f0 !important; } }
  .card {
    background: white; border-radius: 24px; padding: 48px 40px; text-align: center;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 420px; width: 100%;
    border: 3px solid #3b82f6;
  }
  .elevator-icon { font-size: 48px; margin-bottom: 12px; }
  .elevator-name { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
  .elevator-location { font-size: 16px; color: #64748b; margin-bottom: 24px; }
  .qr-container { background: white; padding: 16px; display: inline-block; border-radius: 16px; border: 2px solid #e2e8f0; margin-bottom: 24px; }
  .qr-container img { width: 240px; height: 240px; }
  .divider { height: 2px; background: linear-gradient(to right, transparent, #3b82f6, transparent); margin: 20px 0; }
  .url { font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 16px; }
  .brand { font-size: 11px; color: #cbd5e1; margin-top: 12px; }
</style></head><body>
<div class="card">
  <div class="elevator-icon">🛗</div>
  <div class="elevator-name">${selectedEl.name}</div>
  ${selectedEl.location ? `<div class="elevator-location">${selectedEl.location}</div>` : '<div style="margin-bottom:24px"></div>'}
  <div class="qr-container"><img src="${qrData.qr}" alt="QR Code" /></div>
  <div class="divider"></div>
  ${allProblemScan}
  <div class="url">${qrData.url}</div>
  <div class="brand">Elevator Tracker</div>
</div>
<script>setTimeout(() => window.print(), 500)</script>
</body></html>`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-lg">🛗</div>
            <h1 className="text-xl font-bold text-slate-800">Elevator Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:inline">{admin.email}</span>
            <button onClick={logout} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Elevator List */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Elevators</h2>
              <button
                onClick={() => { setShowForm(true); setEditId(null); setName(''); setLocation('') }}
                className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Add
              </button>
            </div>

            {showForm && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-4 space-y-3 animate-in">
                <input
                  placeholder="Elevator name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <input
                  placeholder="Location / Building"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <div className="flex gap-2">
                  <button onClick={saveElevator} className="bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
                    Save
                  </button>
                  <button onClick={() => setShowForm(false)} className="text-slate-500 px-4 py-2.5 text-sm hover:text-slate-700 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {elevators.map((el) => (
                <div
                  key={el.id}
                  className={`bg-white rounded-2xl p-4 border cursor-pointer transition-all duration-200 ${
                    selectedElevator === el.id
                      ? 'border-blue-500 shadow-md shadow-blue-500/10'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                  onClick={() => { setSelectedElevator(el.id); setActiveTab('stats') }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800">{el.name}</h3>
                      {el.location && <p className="text-sm text-slate-500 mt-0.5">{el.location}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-full font-medium">{el.report_count}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditId(el.id); setName(el.name); setLocation(el.location || ''); setShowForm(true) }}
                        className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteElevator(el.id) }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {elevators.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-4xl mb-3">🛗</p>
                  <p>No elevators yet. Add one!</p>
                </div>
              )}
            </div>

            {/* Invite Admin */}
            <div className="mt-8 bg-white rounded-2xl p-5 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
                Invite Admin
              </h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="admin@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button onClick={inviteAdmin} className="bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-600 transition-colors">
                  Invite
                </button>
              </div>
              {inviteMsg && (
                <p className={`text-sm mt-2 ${inviteMsg.includes('sent') ? 'text-green-600' : 'text-red-500'}`}>
                  {inviteMsg}
                </p>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            {selectedElevator && selectedEl ? (
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
                  {[
                    { key: 'stats' as const, label: 'Statistics', icon: '📊' },
                    { key: 'preview' as const, label: 'Report Preview', icon: '👁️' },
                    { key: 'qr' as const, label: 'QR Code', icon: '📱' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                        activeTab === tab.key
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <span className="mr-1.5">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Stats Tab */}
                {activeTab === 'stats' && (
                  <>
                    {loading ? (
                      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Loading stats...</p>
                      </div>
                    ) : stats ? (
                      <>
                        <div className="bg-white rounded-2xl p-6 border border-slate-200">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-800">Reports ({stats.total} total)</h3>
                            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                              {[7, 30].map((d) => (
                                <button
                                  key={d}
                                  onClick={() => setStatsDays(d)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    statsDays === d ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                                  }`}
                                >
                                  {d} days
                                </button>
                              ))}
                            </div>
                          </div>
                          {stats.timeline.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={stats.timeline}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" tickFormatter={(v: string) => v.substring(5)} stroke="#94a3b8" fontSize={12} />
                                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <p className="text-slate-400 text-center py-8">No reports in this period</p>
                          )}
                        </div>
                        {stats.breakdown.length > 0 && (
                          <div className="bg-white rounded-2xl p-6 border border-slate-200">
                            <h3 className="font-semibold text-slate-800 mb-4">Issue Breakdown</h3>
                            <div className="flex flex-col sm:flex-row items-center gap-8">
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
                              <div className="space-y-3">
                                {stats.breakdown.map((b: any, i: number) => (
                                  <div key={b.issue_type} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-sm text-slate-700">{ISSUE_LABELS[b.issue_type] || b.issue_type}: <strong>{b.count}</strong></span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}
                  </>
                )}

                {/* Preview Tab */}
                {activeTab === 'preview' && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-slate-800">Report Page Preview</h3>
                      <select
                        value={previewLang}
                        onChange={(e) => setPreviewLang(e.target.value as Lang)}
                        className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {languages.map((l) => (
                          <option key={l} value={l}>{languageNames[l]}</option>
                        ))}
                      </select>
                    </div>
                    <ReportPreview elevator={selectedEl} previewLang={previewLang} />
                  </div>
                )}

                {/* QR Tab */}
                {activeTab === 'qr' && qrData && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-6">QR Code</h3>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                      <div className="text-center">
                        <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 inline-block">
                          <img src={qrData.qr} alt="QR Code" className="w-52 h-52" />
                        </div>
                        <p className="text-xs text-slate-400 mt-3 break-all max-w-[240px]">{qrData.url}</p>
                      </div>
                      <div className="space-y-3 flex-1 max-w-xs">
                        <a
                          href={qrData.qr}
                          download={`elevator-qr-${selectedElevator}.png`}
                          className="flex items-center justify-center gap-2 bg-blue-500 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-all w-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                          Download QR
                        </a>
                        <button
                          onClick={printQR}
                          className="flex items-center justify-center gap-2 bg-slate-700 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-slate-800 transition-all w-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                          Print QR Page
                        </button>
                        <div className="bg-blue-50 rounded-xl p-4 mt-4">
                          <p className="text-xs font-semibold text-blue-700 mb-2">Print page includes:</p>
                          <ul className="text-xs text-blue-600 space-y-1">
                            <li>• Elevator name & location</li>
                            <li>• Large QR code</li>
                            <li>• &quot;Problem? Scan!&quot; in all 7 languages</li>
                            <li>• Report URL as text</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-slate-300"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 8 6 4-6 4Z"/></svg>
                <p>Select an elevator to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
