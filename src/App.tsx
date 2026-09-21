import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Board from './pages/Board'
import Schedule from './pages/Schedule'
import Resources from './pages/Resources'
import ResourceTrack from './pages/ResourceTrack'
import Directory from './pages/Directory'
import Space from './pages/Space'

export default function App() {
  return (
    // basename tracks Vite's `base`, so the same build works locally and on GitHub Pages.
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="board" element={<Board />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="resources" element={<Resources />} />
          <Route path="resources/:slug" element={<ResourceTrack />} />
          <Route path="directory" element={<Directory />} />
          <Route path="space" element={<Space />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
