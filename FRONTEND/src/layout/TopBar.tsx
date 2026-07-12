import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ThemeSwitcher } from '../components/shared/ThemeSwitcher'
import { ViewModeSwitcher } from '../components/shared/ViewModeSwitcher'
import { VersoesModal } from '../components/shared/VersoesModal'
import styles from './TopBar.module.css'

const VERSAO_ATUAL = 'v1.1.2'

export function TopBar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [showVersoes, setShowVersoes] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const inicial = usuario?.nomeExibicao.trim()[0] ?? '?'

  return (
    <header className={`no-print ${styles.header}`}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <img src="/izzi-logo.png" alt="Izzi Celulares" />
        </div>
        <button className={styles.versionBadge} onClick={() => setShowVersoes(true)} title="Ver histórico de versões">
          {VERSAO_ATUAL}
        </button>
      </div>

      <div className={styles.spacer} />

      <div className={styles.controls}>
        <ThemeSwitcher />
        <ViewModeSwitcher />
        <div className={styles.divider} />
      </div>

      {showVersoes && <VersoesModal onClose={() => setShowVersoes(false)} />}

      <button className={styles.userButton} onClick={handleLogout} title="Sair">
        <div className={styles.avatar}>{inicial}</div>
        <div className={styles.userText}>
          <div className={styles.userName}>{usuario?.nomeExibicao}</div>
          <div className={styles.userRole}>{usuario?.papel === 'Gestor' ? 'Gestor' : 'Atendente'}</div>
        </div>
      </button>
    </header>
  )
}
