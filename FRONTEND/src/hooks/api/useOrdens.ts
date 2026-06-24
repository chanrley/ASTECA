import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { OrdemServicoCreateRequest, OrdemServicoDto } from '../../api/types'

export interface OrdensFiltro {
  busca?: string
  status?: string[]
}

function buildQuery(filtro: OrdensFiltro): string {
  const params = new URLSearchParams()
  if (filtro.busca) params.set('busca', filtro.busca)
  if (filtro.status?.length) params.set('status', filtro.status.join(','))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function useOrdensList(filtro: OrdensFiltro) {
  return useQuery({
    queryKey: ['ordens', filtro],
    queryFn: () => api.get<OrdemServicoDto[]>(`/ordens${buildQuery(filtro)}`),
  })
}

export function useOrdemDetail(id: number | undefined) {
  return useQuery({
    queryKey: ['ordens', id],
    queryFn: () => api.get<OrdemServicoDto>(`/ordens/${id}`),
    enabled: id !== undefined,
  })
}

export function useOrdemByNumero(numero: number | null) {
  return useQuery({
    queryKey: ['ordens', 'numero', numero],
    queryFn: () => api.get<OrdemServicoDto>(`/ordens/numero/${numero}`),
    enabled: numero !== null,
    retry: false,
  })
}

function useInvalidateOrdens() {
  const qc = useQueryClient()
  return (id?: number) => {
    qc.invalidateQueries({ queryKey: ['ordens'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
    if (id !== undefined) qc.invalidateQueries({ queryKey: ['ordens', id] })
  }
}

export function useCreateOrdem() {
  const invalidate = useInvalidateOrdens()
  return useMutation({
    mutationFn: (req: OrdemServicoCreateRequest) => api.post<OrdemServicoDto>('/ordens', req),
    onSuccess: () => invalidate(),
  })
}

export function useAvancarStatus() {
  const invalidate = useInvalidateOrdens()
  return useMutation({
    mutationFn: (id: number) => api.patch<OrdemServicoDto>(`/ordens/${id}/avancar`),
    onSuccess: (_data, id) => invalidate(id),
  })
}

export function useAguardarPeca() {
  const invalidate = useInvalidateOrdens()
  return useMutation({
    mutationFn: (id: number) => api.patch<OrdemServicoDto>(`/ordens/${id}/aguardar-peca`),
    onSuccess: (_data, id) => invalidate(id),
  })
}

export function useCancelarOrdem() {
  const invalidate = useInvalidateOrdens()
  return useMutation({
    mutationFn: (id: number) => api.patch<OrdemServicoDto>(`/ordens/${id}/cancelar`),
    onSuccess: (_data, id) => invalidate(id),
  })
}

export function useAtualizarObservacoes() {
  const invalidate = useInvalidateOrdens()
  return useMutation({
    mutationFn: ({ id, observacoes }: { id: number; observacoes: string | null }) =>
      api.patch<OrdemServicoDto>(`/ordens/${id}/observacoes`, { observacoes }),
    onSuccess: (_data, vars) => invalidate(vars.id),
  })
}
