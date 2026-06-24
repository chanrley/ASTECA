import { useState } from 'react'
import { useOrdensList } from '../hooks/api/useOrdens'
import { useNovaOsModal } from '../hooks/useNovaOsModal'
import { SearchInput } from '../components/shared/SearchInput'
import { EmptyState } from '../components/shared/EmptyState'
import { StatusFilterChips } from '../components/ordens/StatusFilterChips'
import { OrdemListItem } from '../components/ordens/OrdemListItem'
import styles from './OrdensListPage.module.css'

export function OrdensListPage() {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('Todas')
  const { abrir } = useNovaOsModal()

  const { data: ordens, isLoading } = useOrdensList({
    busca: busca || undefined,
    status: filtro === 'Todas' ? undefined : [filtro],
  })

  return (
    <div>
      <div className={styles.toolbar}>
        <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por OS, cliente, aparelho ou defeito…" />
        <button className={styles.novaOsButton} onClick={abrir}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nova OS
        </button>
      </div>

      <StatusFilterChips ativo={filtro} onChange={setFiltro} />

      {isLoading && <EmptyState>Carregando…</EmptyState>}

      <div className={styles.list}>
        {ordens?.map((o) => <OrdemListItem key={o.id} ordem={o} />)}
      </div>

      {ordens && ordens.length === 0 && <EmptyState>Nenhuma ordem encontrada.</EmptyState>}
    </div>
  )
}
