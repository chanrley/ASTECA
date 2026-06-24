import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrdemByNumero } from '../hooks/api/useOrdens'
import { useClienteByCpf } from '../hooks/api/useClientes'
import { StatusBadge } from '../components/ordens/StatusBadge'
import { formatarMoeda } from '../utils/format'
import styles from './ConsultaPage.module.css'

export function ConsultaPage() {
  const [modo, setModo] = useState<'os' | 'cpf'>('os')

  return (
    <div>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${modo === 'os' ? styles.active : ''}`} onClick={() => setModo('os')}>
          Por nº da OS
        </button>
        <button className={`${styles.tab} ${modo === 'cpf' ? styles.active : ''}`} onClick={() => setModo('cpf')}>
          Por CPF
        </button>
      </div>

      {modo === 'os' ? <ConsultaPorOs /> : <ConsultaPorCpf />}
    </div>
  )
}

function ConsultaPorOs() {
  const navigate = useNavigate()
  const [qOs, setQOs] = useState('')
  const [numero, setNumero] = useState<number | null>(null)
  const { data: ordem, isFetched, isError } = useOrdemByNumero(numero)

  useEffect(() => {
    if (ordem) navigate(`/ordens/${ordem.id}`)
  }, [ordem, navigate])

  function buscar() {
    const n = Number(qOs.replace(/\D/g, ''))
    setNumero(Number.isFinite(n) && n > 0 ? n : null)
  }

  const naoEncontrada = isFetched && isError && numero !== null

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>Consultar OS</div>
      <div className={styles.panelSubtitle}>Digite o número da OS (ex: 106, 99, 96)</div>
      <div className={styles.searchRow}>
        <input
          className={styles.input}
          value={qOs}
          onChange={(e) => setQOs(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
          placeholder="Nº da OS"
        />
        <button className={styles.btnPrimary} onClick={buscar}>
          Abrir
        </button>
      </div>
      {naoEncontrada && <div className={styles.errorText}>OS não encontrada.</div>}
    </div>
  )
}

function ConsultaPorCpf() {
  const navigate = useNavigate()
  const [qCpf, setQCpf] = useState('')
  const [cpfBusca, setCpfBusca] = useState<string | null>(null)
  const { data: cliente, isFetched, isError } = useClienteByCpf(cpfBusca)

  function buscar() {
    setCpfBusca(qCpf.trim() || null)
  }

  const encontrado = isFetched && !isError && !!cliente
  const vazio = isFetched && isError

  return (
    <div className={styles.panelWide}>
      <div className={styles.panel} style={{ marginBottom: 16 }}>
        <div className={styles.panelTitle}>Consultar por CPF</div>
        <div className={styles.panelSubtitle}>Lista todas as OS do cliente e o total</div>
        <div className={styles.searchRow}>
          <input
            className={styles.input}
            value={qCpf}
            onChange={(e) => setQCpf(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscar()}
            placeholder="CPF (ex: 391.264.098-01)"
          />
          <button className={styles.btnPrimary} onClick={buscar}>
            Buscar
          </button>
        </div>
      </div>

      {encontrado && cliente && (
        <div className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <div className={styles.resultAvatar}>{cliente.nome.trim()[0] ?? '?'}</div>
            <div>
              <div className={styles.resultNome}>{cliente.nome}</div>
              <div className={styles.resultDoc}>{cliente.documento}</div>
            </div>
          </div>
          <div className={styles.tableHeader}>
            <div className={styles.tableHeaderOs}>OS</div>
            <div className={styles.tableHeaderAparelho}>Aparelho</div>
            <div className={styles.tableHeaderValor}>Valor</div>
          </div>
          {cliente.ordens.map((o) => (
            <button key={o.id} className={styles.tableRow} onClick={() => navigate(`/ordens/${o.id}`)}>
              <div className={styles.tableRowOs}>{o.numero}</div>
              <div className={styles.tableRowAparelho}>
                <div className={styles.tableRowAparelhoNome}>
                  {o.marca} {o.modelo}
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className={styles.tableRowValor}>{formatarMoeda(o.valor)}</div>
            </button>
          ))}
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>TOTAL</span>
            <span className={styles.totalValue}>{formatarMoeda(cliente.totalGasto)}</span>
          </div>
        </div>
      )}

      {vazio && <div className={styles.emptyResult}>Nenhum cliente com esse CPF. Tente 391.264.098-01.</div>}
    </div>
  )
}
