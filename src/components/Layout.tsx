import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Badge } from './ui/badge'
import { 
  LayoutDashboard, 
  Lightbulb, 
  Trophy, 
  Users, 
  Settings, 
  LogOut,
  Search,
  Menu,
  TrendingUp
} from 'lucide-react'
import NotificationDropdown from './NotificationDropdown'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getInitials, formatPoints } from '../lib/utils'
import { useState, useEffect } from 'react'
import EurolyticsLogo from '../assets/eurolytics_logo.svg'
import { SupabaseService } from '../lib/supabaseService'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarPoints, setSidebarPoints] = useState<number>(user.points)

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      try {
        const fresh = await SupabaseService.getUserById(user.id)
        if (!cancelled && fresh) setSidebarPoints(fresh.points)
      } catch {}
    }
    refresh()
    const id = setInterval(refresh, 8000)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'eurolytics-user') refresh()
    }
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisible)
    return () => { cancelled = true; clearInterval(id); window.removeEventListener('storage', onStorage); document.removeEventListener('visibilitychange', onVisible) }
  }, [user.id])

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '')
      .trim()

  const navigateBySearch = () => {
    const q = normalize(searchQuery)
    if (!q) return

    // Rotas diretas por palavra-chave
    if (q.includes('dashboard') || q === 'home') {
      navigate('/dashboard')
      return
    }
    if (q.includes('quiz')) {
      navigate('/quizzes')
      return
    }
    if (q.includes('ranking') || q.includes('rank')) {
      navigate('/ranking')
      return
    }
    if (q.includes('perfil') || q.includes('profile')) {
      navigate('/perfil')
      return
    }
    if (q.includes('totem')) {
      navigate('/totem')
      return
    }
    if (q.includes('gestao de ideias') || q.includes('gestao ideias') || (q.includes('gestao') && q.includes('ideia'))) {
      navigate('/gestao/ideias')
      return
    }
    if (q.includes('gestao de projetos') || (q.includes('gestao') && q.includes('projeto'))) {
      navigate('/gestao/projetos')
      return
    }
    if ((q.includes('nova') || q.includes('novo') || q.includes('submeter') || q.includes('criar')) && q.includes('ideia')) {
      navigate('/ideias?new=1')
      return
    }
    if (q.includes('gestao') || q.includes('gestao de') || q === 'gestor' || q === 'gestao executiva') {
      navigate('/gestao')
      return
    }
    if (q.includes('projeto') || q.includes('projetos')) {
      navigate('/projetos')
      return
    }
    if (q.includes('ideia') || q.includes('ideias')) {
      navigate('/ideias')
      return
    }

    // Fallback: busca nas ideias
    navigate(`/ideias?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  if (!user) return null

  const isActive = (path: string) => location.pathname === path

  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      roles: ['colaborador', 'gestor', 'executivo']
    },
    { 
      name: 'Projetos', 
      href: '/projetos', 
      icon: TrendingUp,
      roles: ['colaborador', 'gestor', 'executivo']
    },
    { 
      name: 'Minhas Ideias', 
      href: '/ideias', 
      icon: Lightbulb,
      roles: ['colaborador', 'gestor', 'executivo']
    },
    { 
      name: 'Quizzes', 
      href: '/quizzes', 
      icon: Trophy,
      roles: ['colaborador', 'gestor', 'executivo']
    },
    { 
      name: 'Ranking', 
      href: '/ranking', 
      icon: Users,
      roles: ['colaborador', 'gestor', 'executivo']
    },
    { 
      name: 'Gestão', 
      href: '/gestao', 
      icon: Settings,
      roles: ['gestor', 'executivo']
    },
  ]

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(user.role)
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile menu button moved into header (hidden on lg) */}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 eurolytics-sidebar shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:flex lg:flex-shrink-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-4 eurolytics-gradient">
            <div className="flex items-center space-x-3">
              <img src={EurolyticsLogo} alt="Eurolytics" className="w-10 h-10 rounded-xl shadow-lg" />
              <span className="text-white font-bold text-xl tracking-wide">Eurolytics</span>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-4 cursor-pointer" onClick={() => { navigate('/perfil'); setIsSidebarOpen(false) }}>
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-800 text-white font-bold text-lg">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-white truncate">
                  {user.full_name}
                </p>
                <p className="text-sm text-blue-200 truncate">
                  {user.department}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className="eurolytics-badge-glow bg-gradient-to-r text-nowrap from-yellow-600 to-yellow-800 text-white text-xs font-semibold">
                    {formatPoints(sidebarPoints)}
                  </Badge>
                  <Badge 
                    className={`text-xs font-medium ${
                      user.role === 'executivo' ? 'bg-gradient-to-r from-blue-500 to-blue-800 text-white' : 
                      user.role === 'gestor' ? 'bg-gradient-to-r from-yellow-500 to-yellow-800 text-white' : 
                      'bg-white/20 text-blue-100 border-white/30'
                    }`}
                  >
                    {user.role}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-6 space-y-3">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    eurolytics-nav-item flex items-center space-x-4 px-4 py-3 text-sm font-medium transition-all duration-300
                    ${isActive(item.href) 
                      ? 'bg-gradient-to-r from-blue-500/20 to-yellow-500/20 text-white shadow-lg border border-white/20' 
                      : 'text-blue-100 hover:text-white'
                    }
                  `}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className={`h-5 w-5 ${isActive(item.href) ? 'text-blue-300' : 'text-blue-200'}`} />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:text-red-700 hover:bg-red-50"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        {/* Top bar */}
        <header className="bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="lg:hidden">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                {filteredNavigation.find(item => isActive(item.href))?.name || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Navegar entre as funcionalidades..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigateBySearch()
                      setIsSidebarOpen(false)
                    }
                  }}
                  className="pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 shadow-md w-80 transition-all duration-200"
                />
              </div>

              {/* Notifications */}
              <NotificationDropdown />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
