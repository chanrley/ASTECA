import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ThemeSwitcher } from '../components/shared/ThemeSwitcher'
import { ViewModeSwitcher } from '../components/shared/ViewModeSwitcher'
import styles from './TopBar.module.css'

export function TopBar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const inicial = usuario?.nomeExibicao.trim()[0] ?? '?'

  return (
    <header className={`no-print ${styles.header}`}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <span>izzi</span>
        </div>
        <div className={styles.brandText}>
          <div className={styles.brandTitle}>IZZI CELULARES</div>
          <div className={styles.brandSubtitle}>Vendas · Assistência Técnica</div>
        </div>
      </div>

      <div className={styles.spacer} />

      <div className={styles.controls}>
        <ThemeSwitcher />
        <ViewModeSwitcher />
        <div className={styles.divider} />
      </div>

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
