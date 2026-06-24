import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../hooks/api/useDashboard'
import { EmptyState } from '../components/shared/EmptyState'
import { formatarMoeda } from '../utils/format'
import { statusLabel } from '../utils/format'
import type { StatusOrdemServico } from '../api/types'
import styles from './DashboardPage.module.css'

const STATUS_BARRA: { status: StatusOrdemServico; cor: string }[] = [
  { status: 'Aberta', cor: '#1565d8' },
  { status: 'EmAndamento', cor: '#b45309' },
  { status: 'AguardandoPeca', cor: '#7c3aed' },
  { status: 'Pronto', cor: '#0e7490' },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useDashboard()

  if (isLoading || !data) return <EmptyState>Carregando…</EmptyState>

  const maxBarra = Math.max(1, ...STATUS_BARRA.map((s) => data.distribuicaoPorStatus[s.status] ?? 0))

  return (
    <div>
      <div className={styles.badgeRow}>
        <span className={styles.badge}>★ Novo no ASTECA web</span>
        <span className={styles.badgeNote}>Painel gerencial — não existe no Access original</span>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>OS em aberto</span>
            <span className={styles.kpiDot} style={{ background: '#1565d8' }} />
          </div>
          <div className={styles.kpiValue}>{data.osEmAberto}</div>
          <div className={`${styles.kpiDelta} ${styles.kpiDeltaMuted}`}>em atendimento</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Prontas p/ retirar</span>
            <span className={styles.kpiDot} style={{ background: '#0e7490' }} />
          </div>
          <div className={styles.kpiValue}>{data.prontasParaRetirada}</div>
          <div className={`${styles.kpiDelta} ${styles.kpiDeltaMuted}`}>avisar cliente</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Faturamento (entregue)</span>
            <span className={styles.kpiDot} style={{ background: '#0f9d6b' }} />
          </div>
          <div className={styles.kpiValue}>{formatarMoeda(data.faturamentoTotal)}</div>
          <div className={`${styles.kpiDelta} ${styles.kpiDeltaGood}`}>no período</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Clientes</span>
            <span className={styles.kpiDot} style={{ background: '#7c3aed' }} />
          </div>
          <div className={styles.kpiValue}>{data.totalClientes}</div>
          <div className={`${styles.kpiDelta} ${styles.kpiDeltaMuted}`}>cadastrados</div>
        </div>
      </div>

      <div className={styles.columns}>
        <div className={styles.recentCard}>
          <div className={styles.recentHeader}>
            <div className={styles.cardTitle}>Ordens recentes</div>
            <button className={styles.linkButton} onClick={() => navigate('/ordens')}>
              Ver todas →
            </button>
          </div>
          {data.ordensRecentes.map((o) => (
            <button key={o.id} className={styles.recentRow} onClick={() => navigate(`/ordens/${o.id}`)}>
              <div className={styles.recentNum}>{o.numero}</div>
              <div className={styles.recentInfo}>
                <div className={styles.recentCliente}>{o.clienteNome}</div>
                <div className={styles.recentAparelho}>
                  {o.marca} {o.modelo}
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{statusLabel(o.status)}</span>
              <div className={styles.recentValor}>{formatarMoeda(o.valor)}</div>
            </button>
          ))}
        </div>

        <div className={styles.sideCol}>
          <div className={styles.sideCard}>
            <div className={styles.cardTitle} style={{ marginBottom: 16 }}>
              OS por status
            </div>
            {STATUS_BARRA.map((s) => {
              const count = data.distribuicaoPorStatus[s.status] ?? 0
              return (
                <div className={styles.statusBarItem} key={s.status}>
                  <div className={styles.statusBarTop}>
                    <span className={styles.statusBarLabel}>{statusLabel(s.status)}</span>
                    <span className={styles.statusBarCount}>{count}</span>
                  </div>
                  <div className={styles.statusBarTrack}>
                    <div className={styles.statusBarFill} style={{ width: `${Math.round((count / maxBarra) * 100)}%`, background: s.cor }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className={styles.sideCard}>
            <div className={styles.cardTitle}>Aparelhos prontos</div>
            <div className={styles.prontosNote}>Aguardando retirada do cliente</div>
            {data.aparelhosProntos.map((o) => (
              <button key={o.id} className={styles.prontoRow} onClick={() => navigate(`/ordens/${o.id}`)}>
                <div className={styles.prontoNum}>{o.numero}</div>
                <div className={styles.prontoCliente}>{o.clienteNome}</div>
                <div className={styles.prontoValor}>{formatarMoeda(o.valor)}</div>
              </button>
            ))}
            {data.aparelhosProntos.length === 0 && <EmptyState>Nenhum aparelho pronto.</EmptyState>}
          </div>
        </div>
      </div>
    </div>
  )
}
