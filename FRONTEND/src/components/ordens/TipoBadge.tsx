import type { TipoOrdemServico } from '../../api/types'
import { tipoLabel } from '../../utils/format'
import styles from './TipoBadge.module.css'

export function TipoBadge({ tipo }: { tipo: TipoOrdemServico }) {
  return <span className={`${styles.badge} ${styles[tipo]}`}>{tipoLabel(tipo)}</span>
}
