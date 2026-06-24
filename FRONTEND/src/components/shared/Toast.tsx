import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import styles from './Toast.module.css'

interface ToastContextValue {
  showToast: (mensagem: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [mensagem, setMensagem] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setMensagem(msg)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setMensagem(null), 2600)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mensagem && (
        <div className={styles.toast} role="status">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3ddc91" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {mensagem}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>')
  return ctx
}
