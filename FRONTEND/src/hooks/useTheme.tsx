import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Tema = 'corp' | 'vibrante' | 'escuro'

const STORAGE_KEY = 'asteca:tema'

interface ThemeContextValue {
  tema: Tema
  setTema: (tema: Tema) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => {
    const salvo = localStorage.getItem(STORAGE_KEY)
    return salvo === 'corp' || salvo === 'vibrante' || salvo === 'escuro' ? salvo : 'corp'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem(STORAGE_KEY, tema)
  }, [tema])

  return <ThemeContext.Provider value={{ tema, setTema }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>')
  return ctx
}
