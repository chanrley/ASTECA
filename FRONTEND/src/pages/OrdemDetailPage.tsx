import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useOrdemDetail, useAvancarStatus, useAguardarPeca, useCancelarOrdem } from '../hooks/api/useOrdens'
import { EmptyState } from '../components/shared/EmptyState'
import { StatusBadge } from '../components/ordens/StatusBadge'
import { TipoBadge } from '../components/ordens/TipoBadge'
import { OrdemStatusStepper } from '../components/ordens/OrdemStatusStepper'
import { ReciboModal } from '../components/ordens/ReciboModal'
import { useToast } from '../components/shared/Toast'
import { ApiError } from '../api/client'
import { formatarDataHora, formatarDataOnly, formatarMoeda } from '../utils/format'
import styles from './OrdemDetailPage.module.css'

export function OrdemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [showRecibo, setShowRecibo] = useState(false)

  const { data: ordem, isLoading } = useOrdemDetail(Number(id))
  const avancar = useAvancarStatus()
  const aguardarPeca = useAguardarPeca()
  const cancelar = useCancelarOrdem()

  if (isLoading) return <EmptyState>Carregando…</EmptyState>
  if (!ordem) return <EmptyState>Ordem de serviço não encontrada.</EmptyState>

  async function handleAvancar() {
    try {
      const atualizado = await avancar.mutateAsync(ordem!.id)
      showToast(`OS ${atualizado.numero} → status atualizado`)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível avançar o status.')
    }
  }

  async function handleAguardarPeca() {
    try {
      await aguardarPeca.mutateAsync(ordem!.id)
      showToast(`OS ${ordem!.numero} marcada como aguardando peça`)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível marcar como aguardando peça.')
    }
  }

  async function handleCancelar() {
    try {
      await cancelar.mutateAsync(ordem!.id)
      showToast(`OS ${ordem!.numero} cancelada`)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Não foi possível cancelar a OS.')
    }
  }

  const podeAvancar = ordem.status !== 'Entregue' && ordem.status !== 'Cancelada'
  const podeAguardarPeca = ordem.status === 'Aberta' || ordem.status === 'EmAndamento'
  const podeCancelar = ordem.status !== 'Entregue' && ordem.status !== 'Cancelada'
  const cliInicial = ordem.clienteNome.trim()[0] ?? '?'

  return (
    <div>
      <button className={styles.backButton} onClick={() => navigate('/ordens')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Voltar para ordens
      </button>

      <div className={styles.headerCard}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTop}>
            <span className={styles.osNum}>OS {ordem.numero}</span>
            <StatusBadge status={ordem.status} />
            <TipoBadge tipo={ordem.tipo} />
            {ordem.chip && <span className={styles.tag}>Chip</span>}
            {ordem.bateria && <span className={styles.tag}>Bateria</span>}
          </div>
          <div className={styles.subtitle}>
            {ordem.marca} {ordem.modelo} · {ordem.clienteNome}
          </div>
        </div>
        <div className={styles.actions}>
          {podeAvancar && (
            <button className={styles.btnPrimary} onClick={handleAvancar} disabled={avancar.isPending}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
              Avançar status
            </button>
          )}
          {podeAguardarPeca && (
            <button className={styles.btnSecondary} onClick={handleAguardarPeca} disabled={aguardarPeca.isPending}>
              Aguardar peça
            </button>
          )}
          <button className={styles.btnSecondary} onClick={() => setShowRecibo(true)}>
            Orçamento / Recibo
          </button>
          {podeCancelar && (
            <button className={styles.btnDanger} onClick={handleCancelar} disabled={cancelar.isPending}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <OrdemStatusStepper status={ordem.status} />

      <div className={styles.layout}>
        <div className={styles.mainCol}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Aparelho e defeito</div>
            <div className={styles.fieldsGrid}>
              <div>
                <div className={styles.fieldLabel}>Marca</div>
                <div className={styles.fieldValue}>{ordem.marca}</div>
              </div>
              <div>
                <div className={styles.fieldLabel}>Modelo</div>
                <div className={styles.fieldValue}>{ordem.modelo || '—'}</div>
              </div>
              <div>
                <div className={styles.fieldLabel}>Defeito / Item</div>
                <div className={styles.fieldValue}>{ordem.defeito || '—'}</div>
              </div>
            </div>
            <div className={styles.obsBlock}>
              <div className={styles.fieldLabel}>Observações</div>
              <p className={styles.obsText}>{ordem.observacoes || 'Sem observações.'}</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.valorCard}`}>
            <div>
              <div className={styles.fieldLabel}>Valor do serviço</div>
              <div className={styles.valorMeta}>Abertura em {formatarDataOnly(ordem.dataAbertura)}</div>
            </div>
            <div className={styles.valorBig}>{formatarMoeda(ordem.valor)}</div>
          </div>

          <div className={styles.card}>
            <div className={styles.historicoHeader}>
              <div className={styles.cardTitle} style={{ marginBottom: 0 }}>
                Histórico
              </div>
            </div>
            {ordem.historico.map((h, i) => (
              <div className={styles.historicoItem} key={i}>
                <div className={styles.timelineCol}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineLine} />
                </div>
                <div>
                  <div className={styles.evento}>{h.evento}</div>
                  <div className={styles.eventoData}>{formatarDataHora(h.dataHora)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sideCol}>
          <div className={`${styles.card} ${styles.clienteCard}`}>
            <div className={styles.clienteLabel}>Cliente</div>
            <button className={styles.clienteRow} onClick={() => navigate(`/clientes/${ordem.clienteId}`)}>
              <div className={styles.clienteAvatar}>{cliInicial}</div>
              <div>
                <div className={styles.clienteNome}>{ordem.clienteNome}</div>
                <div className={styles.clienteDoc}>{ordem.clienteDocumento}</div>
              </div>
            </button>

            <div className={styles.contactList}>
              <div className={styles.contactItem}>{ordem.clienteTelefone || '—'}</div>
              <div className={styles.contactItem}>{ordem.clienteCelular || '—'}</div>
              <div className={styles.contactItem} style={{ wordBreak: 'break-all' }}>
                {ordem.clienteEmail || '—'}
              </div>
              <div className={styles.contactItem}>{ordem.clienteEndereco || '—'}</div>
            </div>

            <div className={styles.footerRow}>
              <div>
                <div className={styles.fieldLabel}>Código</div>
                <div className={styles.fieldValue}>{ordem.codigo}</div>
              </div>
              <div className={styles.footerRight}>
                <div className={styles.fieldLabel}>Tipo</div>
                <div className={styles.fieldValue}>{ordem.tipo === 'Venda' ? 'Venda' : 'Assistência'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRecibo && <ReciboModal ordem={ordem} onClose={() => setShowRecibo(false)} />}
    </div>
  )
}
