import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import HelicopterList from './components/HelicopterList'
import HelicopterForm from './components/HelicopterForm'
import HelicopterDetail from './components/HelicopterDetail'
import FlightList from './components/FlightList'
import FlightForm from './components/FlightForm'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/">HeliLog</Link>
          </div>
          <ul className="nav-links">
            <li>
              <Link to="/">Dashboard</Link>
            </li>
            <li>
              <Link to="/helicopters">Helicopters</Link>
            </li>
            <li>
              <Link to="/flights">Flights</Link>
            </li>
          </ul>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/helicopters" element={<HelicopterList />} />
            <Route path="/helicopters/new" element={<HelicopterForm />} />
            <Route path="/helicopters/:id" element={<HelicopterDetail />} />
            <Route path="/helicopters/:id/edit" element={<HelicopterForm />} />
            <Route path="/flights" element={<FlightList />} />
            <Route path="/flights/new" element={<FlightForm />} />
            <Route path="/flights/:id/edit" element={<FlightForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
