import { BrowserRouter, Link, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import ClientesPage from './pages/ClientesPage'
import ConfigPage from './pages/ConfigPage'
import EncomendaFormPage from './pages/EncomendaFormPage'
import EncomendasPage from './pages/EncomendasPage'
import KanbanPage from './pages/KanbanPage'

const LINKS = [
  { para: '/kanban', rotulo: 'Kanban' },
  { para: '/encomendas', rotulo: 'Encomendas' },
  { para: '/clientes', rotulo: 'Clientes' },
  { para: '/configuracoes', rotulo: 'Configurações' },
]

function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/kanban" className="text-lg font-extrabold tracking-tight text-blue-700">
            AteliêFlow
          </Link>
          <nav className="flex gap-1 overflow-x-auto">
            {LINKS.map((link) => (
              <NavLink
                key={link.para}
                to={link.para}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {link.rotulo}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/kanban" replace />} />
          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/encomendas" element={<EncomendasPage />} />
          <Route path="/encomendas/nova" element={<EncomendaFormPage />} />
          <Route path="/encomendas/:id/editar" element={<EncomendaFormPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/configuracoes" element={<ConfigPage />} />
          <Route
            path="*"
            element={
              <p className="text-sm text-slate-500">
                Página não encontrada. Use o menu acima para navegar.
              </p>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export function AppRoutes() {
  return <Layout />
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
