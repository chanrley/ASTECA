import { useTheme, type Tema } from '../../hooks/useTheme'
import styles from './ThemeSwitcher.module.css'

const OPCOES: { tema: Tema; label: string }[] = [
  { tema: 'corp', label: 'Azul' },
  { tema: 'vibrante', label: 'Vibrante' },
  { tema: 'escuro', label: 'Escuro' },
]

export function ThemeSwitcher() {
  const { tema, setTema } = useTheme()
  return (
    <div className={styles.group}>
      {OPCOES.map((o) => (
        <button
          key={o.tema}
          onClick={() => setTema(o.tema)}
          className={tema === o.tema ? styles.active : styles.inactive}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
