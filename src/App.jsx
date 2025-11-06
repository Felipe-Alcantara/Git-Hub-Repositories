import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ProjectPage from './pages/ProjectPage'

function App() {
  return (
    <Router basename="/Git-Hub-Repositories">
      <div className="min-h-screen bg-dark-bg text-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project/:id" element={<ProjectPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
