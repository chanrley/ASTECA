import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { ClienteDetailDto, ClienteDto } from '../../api/types'

export function useClientesList(busca?: string) {
  return useQuery({
    queryKey: ['clientes', { busca }],
    queryFn: () => api.get<ClienteDto[]>(`/clientes${busca ? `?busca=${encodeURIComponent(busca)}` : ''}`),
  })
}

export function useClienteDetail(id: number | undefined) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => api.get<ClienteDetailDto>(`/clientes/${id}`),
    enabled: id !== undefined,
  })
}

export function useClienteByCpf(cpf: string | null) {
  return useQuery({
    queryKey: ['clientes', 'cpf', cpf],
    queryFn: () => api.get<ClienteDetailDto>(`/clientes/buscar-cpf?cpf=${encodeURIComponent(cpf ?? '')}`),
    enabled: !!cpf,
    retry: false,
  })
}
