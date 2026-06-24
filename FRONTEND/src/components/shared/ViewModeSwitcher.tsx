import { useViewMode } from '../../hooks/useViewMode'
import styles from './ThemeSwitcher.module.css'

export function ViewModeSwitcher() {
  const { viewMode, setViewMode } = useViewMode()
  return (
    <div className={styles.group}>
      <button title="Desktop" onClick={() => setViewMode('desktop')} className={viewMode === 'desktop' ? styles.active : styles.inactive}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      </button>
      <button title="Celular" onClick={() => setViewMode('mobile')} className={viewMode === 'mobile' ? styles.active : styles.inactive}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="2" width="12" height="20" rx="2.5" />
          <path d="M11 18h2" />
        </svg>
      </button>
    </div>
  )
}
