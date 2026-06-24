import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Papel } from '../api/types'

export function ProtectedRoute({ role }: { role?: Papel }) {
  const { usuario, carregando } = useAuth()

  if (carregando) return null
  if (!usuario) return <Navigate to="/login" replace />
  if (role && usuario.papel !== role) return <Navigate to="/ordens" replace />

  return <Outlet />
}

export function RootRedirect() {
  const { usuario } = useAuth()
  return <Navigate to={usuario?.papel === 'Gestor' ? '/dashboard' : '/ordens'} replace />
}
