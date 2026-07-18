import { Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import HomePage from './pages/HomePage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import GuestbookPage from './guestbook/GuestbookPage'
import AchievementsPage from './pages/AchievementsPage'
import ScrollManager from './components/ScrollManager'

function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/guestbook" element={<GuestbookPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
      </Routes>
      <Analytics />
    </>
  )
}

export default App
