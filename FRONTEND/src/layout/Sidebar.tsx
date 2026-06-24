import { NavLink } from 'react-router-dom'
import { useAuth, isGestor } from '../hooks/useAuth'
import styles from './Sidebar.module.css'

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? `${styles.navItem} ${styles.active}` : styles.navItem)

export function Sidebar({ onNovaOs }: { onNovaOs: () => void }) {
  const { usuario } = useAuth()

  return (
    <aside className={`no-print app-sidebar ${styles.aside}`}>
      <div className={styles.menuLabel}>Menu</div>

      {isGestor(usuario?.papel) && (
        <NavLink to="/dashboard" className={navClass}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
          <span>Início</span>
        </NavLink>
      )}

      <NavLink to="/ordens" className={navClass}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3h6a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2V4a1 1 0 0 1 1-1Z" />
          <path d="M9 11h6M9 15h4" />
        </svg>
        <span>Ordens de Serviço</span>
      </NavLink>

      <NavLink to="/clientes" className={navClass}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
        <span>Clientes</span>
      </NavLink>

      <NavLink to="/consultar" className={navClass}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span>Consultar</span>
      </NavLink>

      {isGestor(usuario?.papel) && (
        <NavLink to="/faturamento" className={navClass}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M6 21V10M12 21V6M18 21v-7" />
          </svg>
          <span>Faturamento</span>
        </NavLink>
      )}

      <div className={styles.grow} />

      <div className={styles.infoBox}>
        CNPJ 19.475.104/0001-80
        <br />
        Rua São Francisco, 33 · Osasco-SP
        <br />
        Tel 4384-0516
      </div>

      <button className={styles.novaOsButton} onClick={onNovaOs}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nova OS
      </button>
    </aside>
  )
}
