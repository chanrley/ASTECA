import type { MouseEvent } from 'react'
import type { OrdemServicoDto } from '../../api/types'
import { useToast } from '../shared/Toast'
import { formatarDataOnly, formatarMoeda } from '../../utils/format'
import styles from './ReciboModal.module.css'

export function ReciboModal({ ordem, onClose }: { ordem: OrdemServicoDto; onClose: () => void }) {
  const { showToast } = useToast()

  function stop(e: MouseEvent) {
    e.stopPropagation()
  }

  function imprimir() {
    showToast('Recibo enviado para impressão')
    window.print()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={stop}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span>izzi</span>
          </div>
          <div>
            <div className={styles.brandTitle}>IZZI CELULARES</div>
            <div className={styles.brandSubtitle}>CNPJ 19.475.104/0001-80 · Tel 4384-0516</div>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.eyebrow}>ORÇAMENTO / RECIBO — OS {ordem.numero}</div>
          <div className={styles.rows}>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Cliente</span>
              <span className={styles.rowValue}>{ordem.clienteNome}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>CPF/CNPJ</span>
              <span className={styles.rowValueMono}>{ordem.clienteDocumento}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Aparelho</span>
              <span className={styles.rowValue}>
                {ordem.marca} {ordem.modelo}
              </span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Serviço</span>
              <span>{ordem.defeito}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Data</span>
              <span className={styles.rowValueMono}>{formatarDataOnly(ordem.dataAbertura)}</span>
            </div>
          </div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>TOTAL</span>
            <span className={styles.totalValue}>{formatarMoeda(ordem.valor)}</span>
          </div>

          <div className={styles.garantia}>
            Garantia de 90 dias para o serviço executado.
            <br />
            Aparelhos não retirados em 90 dias serão descartados.
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.btnSecondary} onClick={onClose}>
            Fechar
          </button>
          <button className={styles.btnPrimary} onClick={imprimir}>
            Imprimir
          </button>
        </div>
      </div>
    </div>
  )
}
