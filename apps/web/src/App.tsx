import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { LogOut, Users } from 'lucide-react'
import { EventListPage } from '@/pages/EventListPage'
import { EventDetailPage } from '@/pages/EventDetailPage'
import { NewEventPage } from '@/pages/NewEventPage'
import { EditEventPage } from '@/pages/EditEventPage'
import { MembersPage } from '@/pages/MembersPage'
import { NewMemberPage } from '@/pages/NewMemberPage'
import { EditMemberPage } from '@/pages/EditMemberPage'
import { LoginPage } from '@/pages/LoginPage'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

function Header() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 px-4 py-3 backdrop-blur">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/" className="text-lg font-bold tracking-tight">
            🏸 BadSync
          </Link>
          <p className="text-xs text-muted-foreground">バドミントン出欠管理</p>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/members">
                <Users /> メンバー
              </Link>
            </Button>
          )}
          {user ? (
            <>
              <span className="px-1 text-sm text-muted-foreground">
                {user.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await logout()
                  navigate('/')
                }}
              >
                <LogOut /> ログアウト
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/login">ログイン</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

function App() {
  const { user, loading } = useAuth()

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col">
      <Header />
      <main className="flex-1 px-4 py-4">
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">読み込み中…</p>
        ) : user ? (
          <Routes>
            <Route path="/" element={<EventListPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/events/new" element={<NewEventPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/events/:id/edit" element={<EditEventPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/members/new" element={<NewMemberPage />} />
            <Route path="/members/:id/edit" element={<EditMemberPage />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </main>
    </div>
  )
}

export default App
