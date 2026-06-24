import { useNavigate } from 'react-router-dom'
import type { ClienteDto } from '../../api/types'
import { formatarMoeda } from '../../utils/format'
import styles from './ClienteCard.module.css'

export function ClienteCard({ cliente }: { cliente: ClienteDto }) {
  const navigate = useNavigate()
  const inicial = cliente.nome.trim()[0] ?? '?'

  return (
    <button className={styles.card} onClick={() => navigate(`/clientes/${cliente.id}`)}>
      <div className={styles.top}>
        <div className={styles.avatar}>{inicial}</div>
        <div className={styles.info}>
          <div className={styles.nome}>{cliente.nome}</div>
          <div className={styles.doc}>{cliente.documento}</div>
        </div>
      </div>
      <div className={styles.footer}>
        <div>
          <div className={styles.footerLabel}>Ordens</div>
          <div className={styles.footerValuePrimary}>{cliente.osCount}</div>
        </div>
        <div>
          <div className={styles.footerLabel}>Total gasto</div>
          <div className={styles.footerValue}>{formatarMoeda(cliente.totalGasto)}</div>
        </div>
      </div>
    </button>
  )
}
