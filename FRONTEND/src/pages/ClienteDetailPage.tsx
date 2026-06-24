import { useNavigate, useParams } from 'react-router-dom'
import { useClienteDetail } from '../hooks/api/useClientes'
import { EmptyState } from '../components/shared/EmptyState'
import { StatusBadge } from '../components/ordens/StatusBadge'
import { formatarDataOnly, formatarMoeda } from '../utils/format'
import styles from './ClienteDetailPage.module.css'

export function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: cliente, isLoading } = useClienteDetail(Number(id))

  if (isLoading) return <EmptyState>Carregando…</EmptyState>
  if (!cliente) return <EmptyState>Cliente não encontrado.</EmptyState>

  const inicial = cliente.nome.trim()[0] ?? '?'

  return (
    <div>
      <button className={styles.backButton} onClick={() => navigate('/clientes')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Voltar para clientes
      </button>

      <div className={styles.layout}>
        <div className={styles.profileCard}>
          <div className={styles.avatar}>{inicial}</div>
          <div className={styles.nome}>{cliente.nome}</div>
          <div className={styles.doc}>{cliente.documento}</div>

          <div className={styles.fields}>
            <div>
              <div className={styles.fieldLabel}>Telefone / Celular</div>
              <div className={styles.fieldValue}>
                {cliente.telefone || '—'} · {cliente.celular || '—'}
              </div>
            </div>
            <div>
              <div className={styles.fieldLabel}>E-mail</div>
              <div className={styles.fieldValue}>{cliente.email || '—'}</div>
            </div>
            <div>
              <div className={styles.fieldLabel}>Endereço</div>
              <div className={styles.fieldValue}>{cliente.endereco || '—'}</div>
            </div>
            <div className={styles.fieldsRow}>
              <div>
                <div className={styles.fieldLabel}>Nasc.</div>
                <div className={styles.fieldValue}>{cliente.dataNascimento ? formatarDataOnly(cliente.dataNascimento) : '—'}</div>
              </div>
              <div>
                <div className={styles.fieldLabel}>RG</div>
                <div className={styles.fieldValue}>{cliente.rg || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.ordersCard}>
          <div className={styles.ordersHeader}>
            <div className={styles.ordersTitle}>Ordens do cliente</div>
            <div className={styles.ordersTotal}>Total {formatarMoeda(cliente.totalGasto)}</div>
          </div>

          {cliente.ordens.map((o) => (
            <button key={o.id} className={styles.orderRow} onClick={() => navigate(`/ordens/${o.id}`)}>
              <div className={styles.orderNum}>{o.numero}</div>
              <div className={styles.orderAparelho}>
                {o.marca} {o.modelo}
              </div>
              <StatusBadge status={o.status} />
              <div className={styles.orderValor}>{formatarMoeda(o.valor)}</div>
            </button>
          ))}

          {cliente.ordens.length === 0 && <EmptyState>Sem ordens registradas.</EmptyState>}
        </div>
      </div>
    </div>
  )
}
