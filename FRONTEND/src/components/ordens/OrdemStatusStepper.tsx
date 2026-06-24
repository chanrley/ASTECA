import type { StatusOrdemServico } from '../../api/types'
import styles from './OrdemStatusStepper.module.css'

const ORDEM: { status: StatusOrdemServico; label: string }[] = [
  { status: 'Aberta', label: 'Aberta' },
  { status: 'EmAndamento', label: 'Em andamento' },
  { status: 'Pronto', label: 'Pronto' },
  { status: 'Entregue', label: 'Entregue' },
]

export function OrdemStatusStepper({ status }: { status: StatusOrdemServico }) {
  const cancelada = status === 'Cancelada'
  let curIdx = ORDEM.findIndex((s) => s.status === status)
  if (status === 'AguardandoPeca') curIdx = 1

  return (
    <div className={styles.card}>
      {ORDEM.map((s, i) => {
        const done = !cancelada && i <= curIdx
        const current = !cancelada && i === curIdx
        return (
          <div className={styles.step} key={s.status}>
            <div className={styles.dotRow}>
              <div className={`${styles.dot} ${done ? styles.done : ''} ${current ? styles.current : ''}`}>{i + 1}</div>
              <div className={`${styles.line} ${i < curIdx && !cancelada ? styles.done : ''}`} />
            </div>
            <div className={`${styles.label} ${done ? styles.done : ''} ${current ? styles.current : ''}`}>{s.label}</div>
          </div>
        )
      })}
    </div>
  )
}
