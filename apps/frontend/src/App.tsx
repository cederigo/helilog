import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import FlightDetail from './components/FlightDetail'
import ModelDetail from './components/ModelDetail'
import ImportFlight, {
  ImportChooser,
  ManualImport,
  EdgetxImport,
  VbarImport,
  ImportComplete,
} from './components/import/ImportFlight'
import './index.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <nav className="border-b border-border bg-card px-8 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-black tracking-widest uppercase text-brand-neon no-underline"
          >
            HeliLog
          </Link>
          {/* <ul className="flex gap-6 list-none m-0 p-0">
            <li>
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors no-underline"
              >
                Dashboard
              </Link>
            </li>
          </ul> */}
        </nav>

        <main className="max-w-5xl mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/import" element={<ImportFlight />}>
              <Route index element={<ImportChooser />} />
              <Route path="manual" element={<ManualImport />} />
              <Route path="edgetx" element={<EdgetxImport />} />
              <Route path="vbar" element={<VbarImport />} />
              <Route path="result" element={<ImportComplete />} />
            </Route>
            <Route path="/flights/:id" element={<FlightDetail />} />
            <Route path="/models/:id" element={<ModelDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
