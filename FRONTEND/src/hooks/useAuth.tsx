import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError } from '../api/client'
import type { Papel, UsuarioInfo } from '../api/types'

interface AuthContextValue {
  usuario: UsuarioInfo | null
  carregando: boolean
  login: (nomeUsuario: string, senha: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioInfo | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api
      .get<UsuarioInfo>('/auth/me')
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false))
  }, [])

  async function login(nomeUsuario: string, senha: string) {
    const info = await api.post<UsuarioInfo>('/auth/login', { nomeUsuario, senha })
    setUsuario(info)
  }

  async function logout() {
    await api.post('/auth/logout')
    setUsuario(null)
  }

  return <AuthContext.Provider value={{ usuario, carregando, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}

export function isGestor(papel: Papel | undefined) {
  return papel === 'Gestor'
}

export { ApiError }
