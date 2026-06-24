export type Papel = 'Gestor' | 'Atendente'

export type StatusOrdemServico = 'Aberta' | 'EmAndamento' | 'AguardandoPeca' | 'Pronto' | 'Entregue' | 'Cancelada'

export type TipoOrdemServico = 'Assistencia' | 'Venda'

export interface UsuarioInfo {
  nomeExibicao: string
  papel: Papel
}

export interface ClienteDto {
  id: number
  cpf: string | null
  cnpj: string | null
  documento: string
  nome: string
  dataNascimento: string | null
  rg: string | null
  telefone: string | null
  celular: string | null
  endereco: string | null
  email: string | null
  osCount: number
  totalGasto: number
}

export interface ClienteDetailDto extends ClienteDto {
  ordens: OrdemServicoDto[]
}

export interface ClienteRequest {
  cpf: string | null
  cnpj: string | null
  nome: string
  dataNascimento: string | null
  rg: string | null
  telefone: string | null
  celular: string | null
  endereco: string | null
  email: string | null
}

export interface HistoricoEventoDto {
  evento: string
  dataHora: string
}

export interface OrdemServicoDto {
  id: number
  numero: number
  codigo: string
  clienteId: number
  clienteNome: string
  clienteDocumento: string
  clienteTelefone: string | null
  clienteCelular: string | null
  clienteEmail: string | null
  clienteEndereco: string | null
  tipo: TipoOrdemServico
  chip: boolean
  bateria: boolean
  marca: string
  modelo: string | null
  defeito: string | null
  valor: number
  dataAbertura: string
  status: StatusOrdemServico
  observacoes: string | null
  historico: HistoricoEventoDto[]
}

export interface ClienteInfoRequest {
  cpf: string | null
  cnpj: string | null
  nome: string
  telefone: string | null
  celular: string | null
  endereco: string | null
  email: string | null
  dataNascimento: string | null
  rg: string | null
}

export interface OrdemServicoCreateRequest {
  cliente: ClienteInfoRequest
  tipo: TipoOrdemServico
  chip: boolean
  bateria: boolean
  marca: string | null
  modelo: string | null
  defeito: string | null
  valor: number
  observacoes: string | null
}

export interface DashboardResponse {
  osEmAberto: number
  prontasParaRetirada: number
  faturamentoTotal: number
  totalClientes: number
  ordensRecentes: OrdemServicoDto[]
  distribuicaoPorStatus: Record<string, number>
  aparelhosProntos: OrdemServicoDto[]
}

export interface FaturamentoMesDto {
  ano: number
  mes: number
  total: number
  quantidade: number
}

export interface FaturamentoMensalResponse {
  meses: FaturamentoMesDto[]
  total: number
  quantidade: number
}
