import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { Landing } from './pages/Landing'
import { MonitorBrechas } from './pages/MonitorBrechas'
import { MonitorColectivo } from './pages/MonitorColectivo'
import { DatosQueremos } from './pages/DatosQueremos'
import { IngresoForm } from './pages/IngresoForm'
import { SearchIndexProvider } from './context/SearchIndexContext'

export default function App() {
  return (
    <SearchIndexProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/brechas" element={<MonitorBrechas />} />
          <Route path="/colectivo" element={<MonitorColectivo />} />
          <Route path="/datos" element={<DatosQueremos />} />
          <Route path="/ingresar" element={<IngresoForm />} />
        </Routes>
      </BrowserRouter>
    </SearchIndexProvider>
  )
}
