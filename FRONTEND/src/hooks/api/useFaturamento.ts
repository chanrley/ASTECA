import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { FaturamentoMensalResponse } from '../../api/types'
import { useAuth, isGestor } from '../useAuth'

export function useFaturamentoMensal(inicio: string, fim: string) {
  const { usuario } = useAuth()
  return useQuery({
    queryKey: ['faturamento', 'mensal', inicio, fim],
    queryFn: () => api.get<FaturamentoMensalResponse>(`/faturamento/mensal?inicio=${inicio}&fim=${fim}`),
    enabled: isGestor(usuario?.papel) && !!inicio && !!fim,
  })
}
