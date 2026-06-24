export function formatarMoeda(valor: number): string {
  return 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Para valores DateOnly ("yyyy-MM-dd", sem hora/timezone) — formata sem passar por Date(),
 * que interpretaria a string como UTC e poderia exibir o dia anterior em fusos negativos. */
export function formatarDataOnly(isoDate: string): string {
  const [ano, mes, dia] = isoDate.split('-')
  return `${dia}/${mes}/${ano}`
}

export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABEL: Record<string, string> = {
  Aberta: 'Aberta',
  EmAndamento: 'Em andamento',
  AguardandoPeca: 'Aguardando peça',
  Pronto: 'Pronto',
  Entregue: 'Entregue',
  Cancelada: 'Cancelada',
}

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status
}

const TIPO_LABEL: Record<string, string> = {
  Assistencia: 'Assistência',
  Venda: 'Venda',
}

export function tipoLabel(tipo: string): string {
  return TIPO_LABEL[tipo] ?? tipo
}
