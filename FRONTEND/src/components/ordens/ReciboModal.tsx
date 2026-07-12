import type { MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import type { OrdemServicoDto } from '../../api/types'
import { useToast } from '../shared/Toast'
import { formatarDataOnly, formatarMoeda } from '../../utils/format'
import styles from './ReciboModal.module.css'

const TERMOS = [
  'O valor aqui cobrado se refere unicamente aos serviços aqui descritos e autorizados não havendo responsabilidade ou obrigação da Izzi Celulares em efetuar reparos que não estejam relacionados aqui. A Izzi Celulares não se responsabiliza em hipótese alguma pela procedência do aparelho.',
  'Por tratar-se de um equipamento eletrônico miniaturizado e interligado entre si, o defeito representado poderá provocar danos aos demais componentes, neste caso, a Izzi Celulares estará isenta de qualquer responsabilidade sobre danos e/ou defeitos causados ao aparelho após sua abertura.',
  'O aparelho que não for retirado no prazo de trinta dias sofrerá reajuste no orçamento.',
  'A empresa não se responsabiliza pela perda de dados, tais como: agenda telefônica, fotos, vídeos, etc.',
  'Caso não seja retirado no prazo de 90 dias, o aparelho será desmontado e sucateado para cobrir gastos de peças e mão de obra (de acordo com o art. 26 inc. 1° do código de defesa do consumidor).',
]

function Via({
  ordem,
  rotulo,
  mostrarObservacoes,
  mostrarTermos,
}: {
  ordem: OrdemServicoDto
  rotulo: string
  mostrarObservacoes: boolean
  mostrarTermos: boolean
}) {
  return (
    <div className={styles.via}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <span>izzi</span>
        </div>
        <div>
          <div className={styles.brandTitle}>IZZI CELULARES</div>
          <div className={styles.brandSubtitle}>CNPJ 19.475.104/0001-80 · Tel 4384-0516</div>
        </div>
        <div className={styles.rotulo}>{rotulo}</div>
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

        {mostrarObservacoes && ordem.observacoes && (
          <div className={styles.observacoes}>
            <span className={styles.rowLabel}>Observações</span>
            <p>{ordem.observacoes}</p>
          </div>
        )}

        {mostrarTermos && (
          <div className={styles.termos}>
            {TERMOS.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function ReciboModal({
  ordem,
  onClose,
  closeLabel = 'Fechar',
}: {
  ordem: OrdemServicoDto
  onClose: () => void
  closeLabel?: string
}) {
  const { showToast } = useToast()

  function stop(e: MouseEvent) {
    e.stopPropagation()
  }

  function imprimir() {
    showToast('Recibo enviado para impressão')
    window.print()
    onClose()
  }

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.toolbar} no-print`} onClick={stop}>
        <span className={styles.toolbarTitle}>Pré-visualização de impressão — folha A4 (2 vias)</span>
        <div className={styles.toolbarActions}>
          <button className={styles.btnSecondary} onClick={onClose}>
            {closeLabel}
          </button>
          <button className={styles.btnPrimary} onClick={imprimir}>
            Imprimir (A4)
          </button>
        </div>
      </div>

      <div className={styles.pageWrap} onClick={stop}>
        <div className={styles.page}>
          <Via ordem={ordem} rotulo="VIA CLIENTE" mostrarObservacoes mostrarTermos />
          <div className={styles.cutLine}>
            <span>✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</span>
          </div>
          <Via ordem={ordem} rotulo="VIA LOJA" mostrarObservacoes={false} mostrarTermos={false} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
