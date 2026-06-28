import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Toaster } from '@/components/ui/sonner'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import CreateTicket from '@/pages/CreateTicket'
import MyTickets from '@/pages/MyTickets'
import AssignedTickets from '@/pages/AssignedTickets'
import TicketDetail from '@/pages/TicketDetail'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

/** Requires authentication; renders the app shell. */
function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  return <AppLayout />
}

/** Only for unauthenticated users (e.g. /login). */
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

/** Restricts a route to specific roles. */
function RoleRoute({ roles, children }) {
  const { role } = useAuth()
  if (!roles.includes(role)) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/create-ticket"
          element={
            <RoleRoute roles={['employee']}>
              <CreateTicket />
            </RoleRoute>
          }
        />
        <Route
          path="/my-tickets"
          element={
            <RoleRoute roles={['employee']}>
              <MyTickets />
            </RoleRoute>
          }
        />
        <Route
          path="/assigned"
          element={
            <RoleRoute roles={['developer']}>
              <AssignedTickets />
            </RoleRoute>
          }
        />
        <Route path="/tickets/:id" element={<TicketDetail />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
