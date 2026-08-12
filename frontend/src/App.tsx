import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './routes/LandingPage'
import LoadingTransition from './routes/LoadingTransition'
import Dashboard from './routes/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/loading" element={<LoadingTransition />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
