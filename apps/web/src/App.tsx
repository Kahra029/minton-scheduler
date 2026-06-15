import { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { Settings, Users } from 'lucide-react'
import { EventListPage } from '@/pages/EventListPage'
import { EventDetailPage } from '@/pages/EventDetailPage'
import { NewEventPage } from '@/pages/NewEventPage'
import { EditEventPage } from '@/pages/EditEventPage'
import { MembersPage } from '@/pages/MembersPage'
import { NewMemberPage } from '@/pages/NewMemberPage'
import { EditMemberPage } from '@/pages/EditMemberPage'
import { AdminTokenField } from '@/components/AdminTokenField'
import { useAdminToken } from '@/hooks/useAdminToken'
import { Button } from '@/components/ui/button'

function App() {
  const [open, setOpen] = useState(false)
  const token = useAdminToken()

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 px-4 py-3 backdrop-blur">
        <div className="flex items-start justify-between">
          <div>
            <Link to="/" className="text-lg font-bold tracking-tight">
              🏸 BadSync
            </Link>
            <p className="text-xs text-muted-foreground">バドミントン出欠管理</p>
          </div>
          <div className="flex items-center gap-1">
            {token && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/members">
                  <Users /> メンバー
                </Link>
              </Button>
            )}
            <Button
              variant={token ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setOpen((o) => !o)}
            >
              <Settings />
              {token ? '管理者' : 'ゲスト'}
            </Button>
          </div>
        </div>
        {open && (
          <div className="mt-3">
            <AdminTokenField onSaved={() => setOpen(false)} />
          </div>
        )}
      </header>
      <main className="flex-1 px-4 py-4">
        <Routes>
          <Route path="/" element={<EventListPage />} />
          <Route path="/events/new" element={<NewEventPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/:id/edit" element={<EditEventPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/members/new" element={<NewMemberPage />} />
          <Route path="/members/:id/edit" element={<EditMemberPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
