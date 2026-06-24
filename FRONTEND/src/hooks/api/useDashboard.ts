import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { DashboardResponse } from '../../api/types'
import { useAuth, isGestor } from '../useAuth'

export function useDashboard() {
  const { usuario } = useAuth()
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardResponse>('/dashboard'),
    enabled: isGestor(usuario?.papel),
  })
}
