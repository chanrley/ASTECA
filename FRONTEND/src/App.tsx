import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ThemeProvider } from './hooks/useTheme'
import { ViewModeProvider } from './hooks/useViewMode'
import { ToastProvider } from './components/shared/Toast'
import { AppRoutes } from './routes/router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ViewModeProvider>
          <ToastProvider>
            <AuthProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </AuthProvider>
          </ToastProvider>
        </ViewModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
