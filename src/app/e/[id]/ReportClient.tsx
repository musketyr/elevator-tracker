'use client'

import { useState, useEffect } from 'react'
import { t, Lang, languages, languageNames, detectBrowserLanguage } from '@/lib/i18n'

interface Elevator {
  id: string
  name: string
  location: string | null
  languages: Lang[]
}

const ISSUES = [
  { key: 'stopped_unexpectedly', icon: '🛑', color: 'bg-red-500 hover:bg-red-600', labelKey: 'stoppedUnexpectedly' },
  { key: 'rumbled_occupied', icon: '📳', color: 'bg-orange-500 hover:bg-orange-600', labelKey: 'rumbledOccupied' },
  { key: 'rumbled_arrival', icon: '⚠️', color: 'bg-yellow-500 hover:bg-yellow-600', labelKey: 'rumbledArrival' },
]

function getDeviceHash(): string {
  const nav = typeof navigator !== 'undefined' ? navigator : null
  if (!nav) return 'unknown'
  const raw = [nav.userAgent, nav.language, screen?.width, screen?.height, new Date().getTimezoneOffset()].join('|')
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

export default function ReportClient({ elevator }: { elevator: Elevator }) {
  const availableLanguages = (elevator.languages && elevator.languages.length > 0 ? elevator.languages : ['en']) as Lang[]
  const [lang, setLang] = useState<Lang>(availableLanguages[0])
  const [submitted, setSubmitted] = useState(false)
  const [submittedFine, setSubmittedFine] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [cooldownMin, setCooldownMin] = useState(0)
  const [loading, setLoading] = useState(false)
  const [honeypot, setHoneypot] = useState('')

  useEffect(() => {
    const detected = detectBrowserLanguage(availableLanguages)
    setLang(detected)

    const lastReport = localStorage.getItem(`report_${elevator.id}`)
    if (lastReport) {
      const elapsed = Date.now() - parseInt(lastReport)
      if (elapsed < 60 * 60 * 1000) {
        setCooldown(true)
        setCooldownMin(Math.ceil((60 * 60 * 1000 - elapsed) / 60000))
      }
    }
  }, [elevator.id, availableLanguages.join(',')])

  const report = async (issueType: string) => {
    if (loading || cooldown) return
    setLoading(true)

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elevator_id: elevator.id,
          issue_type: issueType,
          device_hash: getDeviceHash(),
          honeypot,
        }),
      })

      if (res.status === 429) {
        setCooldown(true)
        setCooldownMin(60)
        return
      }

      if (res.ok) {
        if (issueType === 'everything_fine') {
          setSubmittedFine(true)
        } else {
          setSubmitted(true)
        }
        localStorage.setItem(`report_${elevator.id}`, Date.now().toString())
        setTimeout(() => {
          setCooldown(true)
          setCooldownMin(60)
        }, 3000)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-400 to-green-600">
        <div className="text-center animate-bounce-in">
          <p className="text-8xl mb-6">👍</p>
          <h1 className="text-3xl font-bold text-white mb-2">{t(lang, 'thanks')}</h1>
          <p className="text-white/80 text-lg">{t(lang, 'cooldown', { minutes: '60' })}</p>
        </div>
      </div>
    )
  }

  if (submittedFine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-400 to-teal-600">
        <div className="text-center animate-bounce-in">
          <p className="text-8xl mb-6">✅</p>
          <h1 className="text-3xl font-bold text-white mb-2">{t(lang, 'thanksFine')}</h1>
        </div>
      </div>
    )
  }

  if (cooldown) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-400 to-blue-600">
        <div className="text-center p-8">
          <p className="text-6xl mb-4">⏳</p>
          <p className="text-xl text-white">{t(lang, 'cooldown', { minutes: cooldownMin.toString() })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Language Switcher - only if multiple languages */}
      {availableLanguages.length > 1 && (
        <div className="flex justify-end p-3">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="text-sm bg-white border rounded-lg px-3 py-1.5 shadow-sm"
          >
            {availableLanguages.map((l) => (
              <option key={l} value={l}>{languageNames[l]}</option>
            ))}
          </select>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-5xl mb-3">🛗</p>
          <h1 className="text-2xl font-bold text-gray-800">{elevator.name}</h1>
          {elevator.location && (
            <p className="text-gray-500 mt-1">{elevator.location}</p>
          )}
          <div className="mt-4 bg-blue-500 text-white rounded-2xl py-3 px-6 inline-block shadow-lg">
            <p className="text-lg font-semibold">{t(lang, 'problemScan')}</p>
          </div>
        </div>

        {/* Honeypot (invisible) */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
          tabIndex={-1}
          autoComplete="off"
        />

        {/* Issue Buttons */}
        <div className="space-y-4">
          <h2 className="text-center text-lg font-medium text-gray-700">{t(lang, 'reportIssue')}</h2>
          {ISSUES.map((issue) => (
            <button
              key={issue.key}
              onClick={() => report(issue.key)}
              disabled={loading}
              className={`w-full ${issue.color} text-white rounded-2xl py-6 px-6 text-left flex items-center gap-4 shadow-lg transform transition-all active:scale-95 disabled:opacity-50`}
            >
              <span className="text-4xl">{issue.icon}</span>
              <span className="text-xl font-semibold">{t(lang, issue.labelKey)}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-sm text-gray-400">{t(lang, 'orLetUsKnow')}</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Everything Fine Button */}
        <button
          onClick={() => report('everything_fine')}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-6 px-6 text-left flex items-center gap-4 shadow-lg transform transition-all active:scale-95 disabled:opacity-50 border-2 border-emerald-400"
        >
          <span className="text-4xl">✅</span>
          <span className="text-xl font-semibold">{t(lang, 'everythingFine')}</span>
        </button>
      </div>
    </div>
  )
}
