import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { Landing } from './pages/Landing'
import { MonitorBrechas } from './pages/MonitorBrechas'
import { MonitorColectivo } from './pages/MonitorColectivo'
import { DatosQueremos } from './pages/DatosQueremos'
import { IngresoForm } from './pages/IngresoForm'
import { SearchIndexProvider } from './context/SearchIndexContext'
import { EmbedderProvider } from './context/EmbedderContext'
import { AuthProvider } from './context/AuthContext'
import { Login } from './pages/Login'
import { Revisar } from './pages/Revisar'
import { ProtectedRoute } from './components/ProtectedRoute'

export default function App() {
  return (
    <AuthProvider>
    <SearchIndexProvider>
      <EmbedderProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/brechas" element={<MonitorBrechas />} />
          <Route path="/colectivo" element={<MonitorColectivo />} />
          <Route path="/datos" element={<DatosQueremos />} />
          <Route path="/login" element={<Login />} />
          <Route path="/ingresar" element={<ProtectedRoute><IngresoForm /></ProtectedRoute>} />
          <Route path="/revisar" element={<ProtectedRoute><Revisar /></ProtectedRoute>} />
        </Routes>
        <footer style={{
          textAlign: 'center',
          padding: '2rem 0 1.5rem',
          fontFamily: 'var(--mono)',
          fontSize: '10px',
          color: 'var(--ink-light)',
          letterSpacing: '0.08em',
        }}>
          Desarrollado por Diversa
        </footer>
      </BrowserRouter>
      </EmbedderProvider>
    </SearchIndexProvider>
    </AuthProvider>
  )
}
