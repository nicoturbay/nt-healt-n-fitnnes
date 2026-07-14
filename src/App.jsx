import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Today from './pages/Today'
import Log from './pages/Log'
import Nutrition from './pages/Nutrition'
import Progress from './pages/Progress'
import Photos from './pages/Photos'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Today />} />
        <Route path="log" element={<Log />} />
        <Route path="nutrition" element={<Nutrition />} />
        <Route path="progress" element={<Progress />} />
        <Route path="photos" element={<Photos />} />
      </Route>
    </Routes>
  )
}
