import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Workout from './pages/Workout'
import Log from './pages/Log'
import Nutrition from './pages/Nutrition'
import Progress from './pages/Progress'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="workout" element={<Workout />} />
        <Route path="nutrition" element={<Nutrition />} />
        <Route path="progress" element={<Progress />} />
        <Route path="log" element={<Log />} />
      </Route>
    </Routes>
  )
}
