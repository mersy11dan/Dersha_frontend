import { createContext, useContext, useEffect, useState } from 'react'

export const ACCENT_PALETTES = {
  volt: {
    id: 'volt',
    name: 'Neon Volt',
    primary: '#d5fb45',
    textOn: '#1b3700',
    hover: '#b8e600',
    shadow: 'rgba(213,251,69,0.4)',
    colorHex: '#d5fb45',
  },
  cyan: {
    id: 'cyan',
    name: 'Electric Cyan',
    primary: '#06b6d4',
    textOn: '#083344',
    hover: '#0891b2',
    shadow: 'rgba(6,182,212,0.4)',
    colorHex: '#06b6d4',
  },
  purple: {
    id: 'purple',
    name: 'Cyber Purple',
    primary: '#a855f7',
    textOn: '#3b0764',
    hover: '#9333ea',
    shadow: 'rgba(168,85,247,0.4)',
    colorHex: '#a855f7',
  },
  amber: {
    id: 'amber',
    name: 'Solar Gold',
    primary: '#f59e0b',
    textOn: '#451a03',
    hover: '#d97706',
    shadow: 'rgba(245,158,11,0.4)',
    colorHex: '#f59e0b',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Green',
    primary: '#10b981',
    textOn: '#022c22',
    hover: '#059669',
    shadow: 'rgba(16,185,129,0.4)',
    colorHex: '#10b981',
  },
}

// 3 theme modes in cycle order
const THEME_CYCLE = ['dark', 'light', 'pearl']

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('dersha_theme')
    if (saved && THEME_CYCLE.includes(saved)) return saved
    return 'dark'
  })

  const [accent, setAccent] = useState(() => {
    const savedAccent = localStorage.getItem('dersha_accent')
    if (savedAccent && ACCENT_PALETTES[savedAccent]) return savedAccent
    return 'volt'
  })

  useEffect(() => {
    const root = document.documentElement
    // Remove all theme classes then add the correct one
    root.classList.remove('dark', 'light', 'pearl')
    root.classList.add(theme)
    localStorage.setItem('dersha_theme', theme)
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    // In pearl mode, accent is always cobalt — no user override
    if (theme === 'pearl') {
      root.style.setProperty('--color-primary-fixed', '#2563eb')
      root.style.setProperty('--color-on-primary', '#ffffff')
      root.style.setProperty('--color-primary-hover', '#1d4ed8')
      root.style.setProperty('--color-text-volt', '#2563eb')
      root.style.setProperty('--color-border-volt', '#2563eb')
      return
    }

    const palette = ACCENT_PALETTES[accent] || ACCENT_PALETTES.volt
    root.style.setProperty('--color-primary-fixed', palette.primary)
    root.style.setProperty('--color-on-primary', palette.textOn)
    root.style.setProperty('--color-primary-hover', palette.hover)
    root.style.setProperty('--color-text-volt', palette.primary)
    root.style.setProperty('--color-border-volt', palette.primary)

    localStorage.setItem('dersha_accent', accent)
  }, [accent, theme])

  // Cycle: dark → light → pearl → dark
  const toggleTheme = () => {
    setTheme((prev) => {
      const idx = THEME_CYCLE.indexOf(prev)
      return THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]
    })
  }

  const changeAccent = (accentKey) => {
    if (ACCENT_PALETTES[accentKey]) {
      setAccent(accentKey)
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
        isPearl: theme === 'pearl',
        accent,
        setAccent: changeAccent,
        currentPalette: ACCENT_PALETTES[accent] || ACCENT_PALETTES.volt,
        palettes: ACCENT_PALETTES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
