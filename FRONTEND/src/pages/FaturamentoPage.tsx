import { useMemo, useState } from 'react'
import { useFaturamentoMensal } from '../hooks/api/useFaturamento'
import { EmptyState } from '../components/shared/EmptyState'
import { formatarMoeda } from '../utils/format'
import styles from './FaturamentoPage.module.css'

type TipoPeriodo = 'mesAtual' | 'personalizado' | 'bimestre' | 'semestre' | 'ano'

const TIPO_LABEL: Record<TipoPeriodo, string> = {
  mesAtual: 'Mês atual',
  personalizado: 'Personalizado',
  bimestre: 'Bimestre',
  semestre: 'Semestre',
  ano: 'Ano',
}

const MES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MES_NOMES_LONGOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const ANO_ATUAL = new Date().getFullYear()
const MES_ATUAL = new Date().getMonth() + 1
const ANOS = Array.from({ length: 15 }, (_, i) => ANO_ATUAL - i)
const DATA_MINIMA = `${ANO_ATUAL - 14}-01-01`

const BIMESTRES = Array.from({ length: 6 }, (_, i) => {
  const mesInicio = i * 2 + 1
  return { valor: i + 1, label: `${MES_NOMES[mesInicio - 1]}–${MES_NOMES[mesInicio]}` }
})

const SEMESTRES = [
  { valor: 1, label: `1º semestre (${MES_NOMES[0]}–${MES_NOMES[5]})` },
  { valor: 2, label: `2º semestre (${MES_NOMES[6]}–${MES_NOMES[11]})` },
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function isoHoje() {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`
}

function inicioMes(ano: number, mes: number) {
  return `${ano}-${pad(mes)}-01`
}

function fimMes(ano: number, mes: number) {
  const ultimoDia = new Date(ano, mes, 0).getDate()
  return `${ano}-${pad(mes)}-${pad(ultimoDia)}`
}

function inicioMesAtual() {
  const hoje = new Date()
  return inicioMes(hoje.getFullYear(), hoje.getMonth() + 1)
}

export function FaturamentoPage() {
  const [tipo, setTipo] = useState<TipoPeriodo>('mesAtual')
  const [ano, setAno] = useState(ANO_ATUAL)
  const [bimestre, setBimestre] = useState(1)
  const [semestre, setSemestre] = useState(1)
  const [personalInicio, setPersonalInicio] = useState(inicioMesAtual)
  const [personalFim, setPersonalFim] = useState(isoHoje)

  const { inicio, fim } = useMemo(() => {
    switch (tipo) {
      case 'mesAtual':
        return { inicio: inicioMes(ANO_ATUAL, MES_ATUAL), fim: fimMes(ANO_ATUAL, MES_ATUAL) }
      case 'bimestre': {
        const mesInicio = (bimestre - 1) * 2 + 1
        return { inicio: inicioMes(ano, mesInicio), fim: fimMes(ano, mesInicio + 1) }
      }
      case 'semestre': {
        const mesInicio = semestre === 1 ? 1 : 7
        return { inicio: inicioMes(ano, mesInicio), fim: fimMes(ano, mesInicio + 5) }
      }
      case 'personalizado':
        return { inicio: personalInicio, fim: personalFim }
      case 'ano':
      default:
        return { inicio: inicioMes(ano, 1), fim: fimMes(ano, 12) }
    }
  }, [tipo, ano, bimestre, semestre, personalInicio, personalFim])

  const periodoValido = !!inicio && !!fim && inicio <= fim
  const { data, isLoading, isError } = useFaturamentoMensal(periodoValido ? inicio : '', periodoValido ? fim : '')

  const maxValor = Math.max(1, ...(data?.meses.map((m) => m.total) ?? []))

  return (
    <div>
      <div className={styles.tabs}>
        {(Object.keys(TIPO_LABEL) as TipoPeriodo[]).map((opcao) => (
          <button key={opcao} className={`${styles.tab} ${tipo === opcao ? styles.active : ''}`} onClick={() => setTipo(opcao)}>
            {TIPO_LABEL[opcao]}
          </button>
        ))}
      </div>

      <div className={styles.filtros}>
        {tipo === 'mesAtual' && <div className={styles.periodoFixo}>{MES_NOMES_LONGOS[MES_ATUAL - 1]}/{ANO_ATUAL}</div>}

        {tipo === 'personalizado' && (
          <>
            <input
              type="date"
              className={styles.dateInput}
              value={personalInicio}
              min={DATA_MINIMA}
              max={isoHoje()}
              onChange={(e) => setPersonalInicio(e.target.value)}
            />
            <span className={styles.ate}>até</span>
            <input
              type="date"
              className={styles.dateInput}
              value={personalFim}
              min={DATA_MINIMA}
              max={isoHoje()}
              onChange={(e) => setPersonalFim(e.target.value)}
            />
          </>
        )}

        {(tipo === 'ano' || tipo === 'bimestre' || tipo === 'semestre') && (
          <>
            <select className={styles.select} value={ano} onChange={(e) => setAno(Number(e.target.value))}>
              {ANOS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            {tipo === 'bimestre' && (
              <select className={styles.select} value={bimestre} onChange={(e) => setBimestre(Number(e.target.value))}>
                {BIMESTRES.map((b) => (
                  <option key={b.valor} value={b.valor}>
                    {b.label}
                  </option>
                ))}
              </select>
            )}
            {tipo === 'semestre' && (
              <select className={styles.select} value={semestre} onChange={(e) => setSemestre(Number(e.target.value))}>
                {SEMESTRES.map((s) => (
                  <option key={s.valor} value={s.valor}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
      </div>

      {!periodoValido && <div className={styles.errorText}>Selecione um período válido: data final maior ou igual à inicial.</div>}

      {periodoValido && isLoading && <EmptyState>Carregando…</EmptyState>}

      {periodoValido && isError && (
        <div className={styles.errorText}>Não foi possível carregar o faturamento para esse período. Verifique as datas e tente novamente.</div>
      )}

      {periodoValido && data && (
        <>
          <div className={styles.kpiRow}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiLabel}>Faturamento no período</div>
              <div className={styles.kpiValue}>{formatarMoeda(data.total)}</div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiLabel}>OS entregues</div>
              <div className={styles.kpiValue}>{data.quantidade}</div>
            </div>
          </div>

          <div className={styles.tabela}>
            <div className={styles.linhaHeader}>
              <div className={styles.colMes}>Mês</div>
              <div className={styles.colBarra} />
              <div className={styles.colQtd}>OS</div>
              <div className={styles.colValor}>Faturado</div>
            </div>
            {data.meses.map((m) => (
              <div className={styles.linha} key={`${m.ano}-${m.mes}`}>
                <div className={styles.colMes}>
                  {MES_NOMES_LONGOS[m.mes - 1]}/{m.ano}
                </div>
                <div className={styles.colBarra}>
                  <div className={styles.barraTrack}>
                    <div className={styles.barraFill} style={{ width: `${Math.round((m.total / maxValor) * 100)}%` }} />
                  </div>
                </div>
                <div className={styles.colQtd}>{m.quantidade}</div>
                <div className={styles.colValor}>{formatarMoeda(m.total)}</div>
              </div>
            ))}
            {data.meses.length === 0 && <EmptyState>Nenhum mês no período selecionado.</EmptyState>}
          </div>
        </>
      )}
    </div>
  )
}
