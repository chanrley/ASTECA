import { useNavigate } from 'react-router-dom'
import type { OrdemServicoDto } from '../../api/types'
import { formatarMoeda } from '../../utils/format'
import { StatusBadge } from './StatusBadge'
import { TipoBadge } from './TipoBadge'
import styles from './OrdemListItem.module.css'

export function OrdemListItem({ ordem }: { ordem: OrdemServicoDto }) {
  const navigate = useNavigate()

  return (
    <button className={styles.card} onClick={() => navigate(`/ordens/${ordem.id}`)}>
      <div>
        <div className={styles.numRow}>
          <span className={styles.num}>OS {ordem.numero}</span>
          <TipoBadge tipo={ordem.tipo} />
        </div>
        <div className={styles.cliente}>{ordem.clienteNome}</div>
      </div>
      <div>
        <div className={styles.colLabel}>Aparelho</div>
        <div className={styles.colValue}>
          {ordem.marca} {ordem.modelo}
        </div>
      </div>
      <div>
        <div className={styles.colLabel}>Defeito / Item</div>
        <div className={styles.colValue}>{ordem.defeito}</div>
      </div>
      <div>
        <div className={`${styles.colLabel} ${styles.statusCol}`}>Status</div>
        <StatusBadge status={ordem.status} />
      </div>
      <div className={styles.valorCol}>
        <div className={styles.colLabel}>Valor</div>
        <div className={styles.valor}>{formatarMoeda(ordem.valor)}</div>
      </div>
    </button>
  )
}
