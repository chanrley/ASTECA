import type { StatusOrdemServico } from '../../api/types'
import { statusLabel } from '../../utils/format'
import styles from './StatusBadge.module.css'

export function StatusBadge({ status }: { status: StatusOrdemServico }) {
  return <span className={`${styles.badge} ${styles[status]}`}>{statusLabel(status)}</span>
}
