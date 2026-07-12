import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { VersaoDto } from '../../api/types'

export function useVersoes(habilitado: boolean) {
  return useQuery({
    queryKey: ['versoes'],
    queryFn: () => api.get<VersaoDto[]>('/versoes'),
    enabled: habilitado,
  })
}
