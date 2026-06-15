import { useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  CopyPlus,
  Coins,
  LogIn,
  LogOut,
  Menu,
  Users,
} from 'lucide-react'
import { EventListPage } from '@/pages/EventListPage'
import { EventDetailPage } from '@/pages/EventDetailPage'
import { NewEventPage } from '@/pages/NewEventPage'
import { EditEventPage } from '@/pages/EditEventPage'
import { MembersPage } from '@/pages/MembersPage'
import { NewMemberPage } from '@/pages/NewMemberPage'
import { EditMemberPage } from '@/pages/EditMemberPage'
import { TemplatesPage } from '@/pages/TemplatesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { LoginPage } from '@/pages/LoginPage'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <SheetClose asChild>
      <Link
        to={to}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
      >
        {icon}
        {label}
      </Link>
    </SheetClose>
  )
}

function Header() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="text-lg font-bold tracking-tight">
            信天翁
          </Link>
          <p className="text-xs text-muted-foreground">出欠管理</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="メニュー">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>メニュー</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-2">
              <NavItem to="/" icon={<CalendarDays />} label="イベント一覧" />
              {isAdmin && (
                <>
                  <NavItem to="/templates" icon={<CopyPlus />} label="テンプレート" />
                  <NavItem to="/members" icon={<Users />} label="メンバー" />
                  <NavItem to="/settings" icon={<Coins />} label="料金設定" />
                </>
              )}
            </nav>
            <div className="mt-auto border-t p-2">
              {user ? (
                <button
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  onClick={async () => {
                    setOpen(false)
                    await logout()
                    navigate('/')
                  }}
                >
                  <LogOut /> ログアウト
                </button>
              ) : (
                <NavItem to="/login" icon={<LogIn />} label="ログイン" />
              )}
            </div>
          </SheetContent>
        </Sheet>
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
        ) : (
          <Routes>
            {/* 公開: 一覧・詳細は未ログインでも閲覧可 (詳細の個人名は出さない) */}
            <Route path="/" element={<EventListPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route
              path="/login"
              element={user ? <Navigate to="/" replace /> : <LoginPage />}
            />
            {/* admin 機能。各ページ内の RequireAdmin が未ログイン/非adminを弾く */}
            <Route path="/events/new" element={<NewEventPage />} />
            <Route path="/events/:id/edit" element={<EditEventPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/members/new" element={<NewMemberPage />} />
            <Route path="/members/:id/edit" element={<EditMemberPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </div>
  )
}

export default App
