import { useState } from 'react'
import { useClientesList } from '../hooks/api/useClientes'
import { SearchInput } from '../components/shared/SearchInput'
import { EmptyState } from '../components/shared/EmptyState'
import { ClienteCard } from '../components/clientes/ClienteCard'
import styles from './ClientesListPage.module.css'

export function ClientesListPage() {
  const [busca, setBusca] = useState('')
  const { data: clientes, isLoading } = useClientesList(busca)

  return (
    <div>
      <div className={styles.toolbar}>
        <SearchInput value={busca} onChange={setBusca} placeholder="Buscar cliente por nome ou CPF…" />
      </div>

      {isLoading && <EmptyState>Carregando…</EmptyState>}

      {clientes && clientes.length > 0 && (
        <div className={styles.grid}>
          {clientes.map((c) => (
            <ClienteCard key={c.id} cliente={c} />
          ))}
        </div>
      )}

      {clientes && clientes.length === 0 && <EmptyState>Nenhum cliente encontrado.</EmptyState>}
    </div>
  )
}
