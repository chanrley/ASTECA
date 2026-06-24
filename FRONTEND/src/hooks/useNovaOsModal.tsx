import { createContext, useContext, useState, type ReactNode } from 'react'

interface NovaOsModalContextValue {
  aberto: boolean
  abrir: () => void
  fechar: () => void
}

const NovaOsModalContext = createContext<NovaOsModalContextValue | null>(null)

export function NovaOsModalProvider({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(false)
  return (
    <NovaOsModalContext.Provider value={{ aberto, abrir: () => setAberto(true), fechar: () => setAberto(false) }}>
      {children}
    </NovaOsModalContext.Provider>
  )
}

export function useNovaOsModal() {
  const ctx = useContext(NovaOsModalContext)
  if (!ctx) throw new Error('useNovaOsModal deve ser usado dentro de <NovaOsModalProvider>')
  return ctx
}
