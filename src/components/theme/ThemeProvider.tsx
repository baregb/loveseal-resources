'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  resolved: ResolvedTheme
  setMode: (m: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState]   = useState<ThemeMode>('system')
  const [resolved, setResolved] = useState<ResolvedTheme>('dark')

  // Apply the resolved theme to <html>
  const applyTheme = useCallback((m: ThemeMode) => {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const next: ResolvedTheme =
      m === 'system' ? (systemDark ? 'dark' : 'light') : m
    document.documentElement.setAttribute('data-theme', next)
    setResolved(next)
  }, [])

  // Initial load
  useEffect(() => {
    const saved = (localStorage.getItem('theme-mode') as ThemeMode | null) ?? 'system'
    setModeState(saved)
    applyTheme(saved)
  }, [applyTheme])

  // Listen for OS theme changes (only matters in 'system' mode)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => { if (mode === 'system') applyTheme('system') }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode, applyTheme])

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m)
    localStorage.setItem('theme-mode', m)
    applyTheme(m)
  }, [applyTheme])

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
