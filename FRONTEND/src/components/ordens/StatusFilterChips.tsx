import type { StatusOrdemServico } from '../../api/types'
import { statusLabel } from '../../utils/format'
import styles from './StatusFilterChips.module.css'

const OPCOES: ('Todas' | StatusOrdemServico)[] = ['Todas', 'Aberta', 'EmAndamento', 'AguardandoPeca', 'Pronto', 'Entregue']

export function StatusFilterChips({ ativo, onChange }: { ativo: string; onChange: (valor: string) => void }) {
  return (
    <div className={styles.row}>
      {OPCOES.map((opcao) => (
        <button key={opcao} className={`${styles.chip} ${ativo === opcao ? styles.active : ''}`} onClick={() => onChange(opcao)}>
          {opcao === 'Todas' ? 'Todas' : statusLabel(opcao)}
        </button>
      ))}
    </div>
  )
}
