import { Link, Route, Routes } from 'react-router-dom'
import { EventListPage } from '@/pages/EventListPage'
import { EventDetailPage } from '@/pages/EventDetailPage'

function App() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 px-4 py-3 backdrop-blur">
        <Link to="/" className="text-lg font-bold tracking-tight">
          🏸 BadSync
        </Link>
        <p className="text-xs text-muted-foreground">バドミントン出欠管理</p>
      </header>
      <main className="flex-1 px-4 py-4">
        <Routes>
          <Route path="/" element={<EventListPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
