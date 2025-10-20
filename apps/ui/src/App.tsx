import { Routes, Route } from 'react-router-dom'
import { IntakeWizard } from './components/wizard/IntakeWizard'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<IntakeWizard />} />
        <Route path="/intake" element={<IntakeWizard />} />
      </Routes>
    </div>
  )
}

export default App
