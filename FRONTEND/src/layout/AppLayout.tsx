import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobilePreviewFrame } from './MobilePreviewFrame'
import { NovaOsModalProvider, useNovaOsModal } from '../hooks/useNovaOsModal'
import { NovaOsModal } from '../components/ordens/NovaOsModal'
import styles from './AppLayout.module.css'

function AppLayoutInner() {
  const { abrir } = useNovaOsModal()

  return (
    <MobilePreviewFrame>
      <div className={styles.root}>
        <TopBar />
        <div className={styles.body}>
          <Sidebar onNovaOs={abrir} />
          <main className={`no-print ${styles.main}`}>
            <div className={styles.mainPad}>
              <Outlet />
            </div>
          </main>
        </div>
        <BottomNav onNovaOs={abrir} />
        <NovaOsModal />
      </div>
    </MobilePreviewFrame>
  )
}

export function AppLayout() {
  return (
    <NovaOsModalProvider>
      <AppLayoutInner />
    </NovaOsModalProvider>
  )
}
