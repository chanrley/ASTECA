import type { ReactNode } from 'react'
import { useViewMode } from '../hooks/useViewMode'
import '../styles/mobile-frame.css'

/**
 * Toggle "ver como celular": envolve o app num frame fixo de smartphone — cosmético/demonstrativo.
 * A árvore de divs é sempre a mesma (só o className muda) para não mudar a posição do <Outlet/>
 * na árvore React — se a estrutura mudasse (Fragment <-> div), o React desmontaria e remontaria
 * a página inteira a cada toggle, perdendo o estado local de qualquer tela aberta.
 */
export function MobilePreviewFrame({ children }: { children: ReactNode }) {
  const { viewMode } = useViewMode()
  const isMobile = viewMode === 'mobile'

  return (
    <div className={isMobile ? 'mobileFrameOuter' : 'frameOuterFull'}>
      <div className={isMobile ? 'mobileFrame' : 'frameInnerFull'} data-view-mode={isMobile ? 'mobile' : undefined}>
        {children}
      </div>
    </div>
  )
}
