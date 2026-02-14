'use client'

import { useState, useEffect } from 'react'
import { t, Lang, languages, languageNames, detectBrowserLanguage } from '@/lib/i18n'

const LANG_FLAGS: Record<string, string> = {
  en: '🇬🇧', cs: '🇨🇿', sk: '🇸🇰', uk: '🇺🇦', ru: '🇷🇺', de: '🇩🇪', fr: '🇫🇷',
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [lang, setLang] = useState<Lang>('en')
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setMounted(true)
    setLang(detectBrowserLanguage())
    fetch('/api/auth/status').then(r => r.json()).then(d => { if (d.loggedIn) setLoggedIn(true) }).catch(() => {})
  }, [])

  const features = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><rect width="5" height="5" x="16" y="16" rx="1"/><path d="M8 3h8"/><path d="M8 16h8"/><path d="M3 8v8"/><path d="M16 8v8"/></svg>
      ),
      title: t(lang, 'featureQRTitle'),
      desc: t(lang, 'featureQRDesc'),
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m2 12 5.1 2.8"/><path d="m22 12-5.1 2.8"/><path d="m7.1 14.8 2.4 4.4"/><path d="m14.5 19.2 2.4-4.4"/><path d="m9.5 4.8 2.4 4.4"/><path d="m16.9 9.2-2.4 4.4"/><path d="m9.5 4.8-2.4 4.4"/><path d="m14.5 4.8 2.4 4.4"/></svg>
      ),
      title: t(lang, 'featureLangTitle'),
      desc: t(lang, 'featureLangDesc'),
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/></svg>
      ),
      title: t(lang, 'featureStatsTitle'),
      desc: t(lang, 'featureStatsDesc'),
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
      ),
      title: t(lang, 'featureDashTitle'),
      desc: t(lang, 'featureDashDesc'),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-xl font-bold">
            🛗
          </div>
          <span className="text-xl font-bold">Elevator Tracker</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="text-sm bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1.5"
          >
            {languages.map((l) => (
              <option key={l} value={l}>{LANG_FLAGS[l]} {languageNames[l]}</option>
            ))}
          </select>
          <a
            href={loggedIn ? "/admin" : "/admin/login"}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 text-sm whitespace-nowrap"
          >
            {loggedIn ? t(lang, 'dashboard') : t(lang, 'logIn')}
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-24 text-center">
        <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-blue-300 text-sm mb-8">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            {t(lang, 'heroTagline')}
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {t(lang, 'heroTitle1')}
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {t(lang, 'heroTitle2')}
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            {t(lang, 'heroDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={loggedIn ? "/admin" : "/admin/login"}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5"
            >
              {loggedIn ? t(lang, 'dashboard') : t(lang, 'getStarted')}
            </a>
          </div>
        </div>

        {/* Demo phone mockup */}
        <div className={`mt-16 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="max-w-xs mx-auto bg-white rounded-[2.5rem] p-3 shadow-2xl shadow-blue-500/10">
            <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-[2rem] p-6 text-left">
              <div className="text-center mb-4">
                <p className="text-4xl mb-2">🛗</p>
                <h3 className="text-lg font-bold text-gray-800">Building A — Lobby</h3>
                <div className="mt-2 bg-blue-500 text-white rounded-xl py-2 px-4 inline-block text-sm font-semibold">
                  {t(lang, 'problemScan')}
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="bg-red-500 text-white rounded-xl py-3 px-4 flex items-center gap-3 text-sm font-medium shadow">
                  <span className="text-xl">🛑</span> {t(lang, 'stoppedWithMe')}
                </div>
                <div className="bg-orange-500 text-white rounded-xl py-3 px-4 flex items-center gap-3 text-sm font-medium shadow">
                  <span className="text-xl">📳</span> {t(lang, 'rumbledWithMe')}
                </div>
                <div className="bg-yellow-500 text-white rounded-xl py-3 px-4 flex items-center gap-3 text-sm font-medium shadow">
                  <span className="text-xl">⚠️</span> {t(lang, 'rumbledBeforeArrival')}
                </div>
                <div className="bg-emerald-500 text-white rounded-xl py-3 px-4 flex items-center gap-3 text-sm font-medium shadow border border-emerald-400">
                  <span className="text-xl">✅</span> {t(lang, 'everythingFine')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <h2 className="text-3xl font-bold text-center mb-4">{t(lang, 'howItWorks')}</h2>
        <p className="text-slate-400 text-center mb-12 max-w-lg mx-auto">
          {t(lang, 'howItWorksDesc')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800 hover:border-slate-600 transition-all duration-300"
            >
              <div className="text-blue-400 mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Language strip */}
      <section className="max-w-6xl mx-auto px-4 pb-24 text-center">
        <h2 className="text-2xl font-bold mb-6">{t(lang, 'multilingualSupport')}</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {languages.map((l) => (
            <div
              key={l}
              className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-3 flex items-center gap-2 text-sm"
            >
              <span className="text-lg">{LANG_FLAGS[l]}</span>
              <span className="font-medium">{languageNames[l]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-24 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">{t(lang, 'ctaTitle')}</h2>
          <p className="text-blue-100 mb-8 max-w-lg mx-auto">
            {t(lang, 'ctaDesc')}
          </p>
          <a
            href={loggedIn ? "/admin" : "/admin/login"}
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            {loggedIn ? t(lang, 'dashboard') : t(lang, 'ctaButton')}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        <p>{t(lang, 'footerText')}</p>
      </footer>
    </div>
  )
}
