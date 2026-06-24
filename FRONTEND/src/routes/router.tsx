import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, RootRedirect } from './ProtectedRoute'
import { AppLayout } from '../layout/AppLayout'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { OrdensListPage } from '../pages/OrdensListPage'
import { OrdemDetailPage } from '../pages/OrdemDetailPage'
import { ClientesListPage } from '../pages/ClientesListPage'
import { ClienteDetailPage } from '../pages/ClienteDetailPage'
import { ConsultaPage } from '../pages/ConsultaPage'
import { FaturamentoPage } from '../pages/FaturamentoPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<RootRedirect />} />

          <Route element={<ProtectedRoute role="Gestor" />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="faturamento" element={<FaturamentoPage />} />
          </Route>

          <Route path="ordens" element={<OrdensListPage />} />
          <Route path="ordens/:id" element={<OrdemDetailPage />} />
          <Route path="clientes" element={<ClientesListPage />} />
          <Route path="clientes/:id" element={<ClienteDetailPage />} />
          <Route path="consultar" element={<ConsultaPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
