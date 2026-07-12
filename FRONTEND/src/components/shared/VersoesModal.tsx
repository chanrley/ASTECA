import type { MouseEvent } from 'react'
import { useVersoes } from '../../hooks/api/useVersoes'
import { formatarDataHora } from '../../utils/format'
import styles from './VersoesModal.module.css'

export function VersoesModal({ onClose }: { onClose: () => void }) {
  const { data: versoes, isLoading } = useVersoes(true)

  function stop(e: MouseEvent) {
    e.stopPropagation()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={stop}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>Histórico de versões</div>
            <div className={styles.subtitle}>O que mudou em cada atualização do sistema</div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          {isLoading && <div className={styles.empty}>Carregando…</div>}
          {!isLoading && (!versoes || versoes.length === 0) && <div className={styles.empty}>Nenhuma versão registrada.</div>}
          {!isLoading && versoes && versoes.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Versão</th>
                  <th>Alteração</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {versoes.map((v) => (
                  <tr key={v.id}>
                    <td className={styles.mono}>{v.id}</td>
                    <td className={styles.versao}>{v.versao}</td>
                    <td>{v.mensagem}</td>
                    <td className={styles.mono}>{formatarDataHora(v.criadoEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
