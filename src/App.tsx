import { Routes, Route } from 'react-router-dom'
import { StoreProvider } from './lib/store'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Toasts from './components/Toasts'
import Home from './pages/Home'
import Results from './pages/Results'
import PropertyPage from './pages/PropertyPage'
import Saved from './pages/Saved'
import Compare from './pages/Compare'
import Experiences from './pages/Experiences'
import About from './pages/About'
import MyRequests from './pages/MyRequests'
import Admin from './pages/Admin'
import { Empty } from './components/States'

export default function App() {
  return (
    <StoreProvider>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/results" element={<Results />} />
            <Route path="/property/:id" element={<PropertyPage />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/experiences" element={<Experiences />} />
            <Route path="/requests" element={<MyRequests />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<div className="container page-pad"><Empty title="That page doesn’t exist" /></div>} />
          </Routes>
        </main>
        <Footer />
        <Toasts />
      </div>
    </StoreProvider>
  )
}
