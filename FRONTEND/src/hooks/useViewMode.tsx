import { createContext, useContext, useState, type ReactNode } from 'react'

export type ViewMode = 'desktop' | 'mobile'

interface ViewModeContextValue {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null)

/** Toggle "ver como celular" — puramente cosmético/demonstrativo, não persiste entre sessões. */
export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  return <ViewModeContext.Provider value={{ viewMode, setViewMode }}>{children}</ViewModeContext.Provider>
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext)
  if (!ctx) throw new Error('useViewMode deve ser usado dentro de <ViewModeProvider>')
  return ctx
}
