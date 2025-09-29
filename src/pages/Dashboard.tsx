import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Button } from '../components/ui/button'
import { 
  Lightbulb, 
  Trophy, 
  Users, 
  TrendingUp, 
  Star,
  Award,
  Target,
  ArrowRight
} from 'lucide-react'
import { SupabaseService } from '../lib/supabaseService'
import { formatPoints, formatDate } from '../lib/utils'
import { Link } from 'react-router-dom'
import EurolyticsLogo from '../assets/eurolytics_logo.svg'
import { useState, useEffect } from 'react'
import type { Idea, User } from '../types/index'

export default function Dashboard() {
  const { user } = useAuth()
  const [allUserIdeas, setAllUserIdeas] = useState<Idea[]>([])
  const [userIdeas, setUserIdeas] = useState<Idea[]>([])
  const [userRanking, setUserRanking] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [rankingUsers, setRankingUsers] = useState<User[]>([])
  const [quizzesCompleted, setQuizzesCompleted] = useState<number>(0)

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return
      
      try {
        // Carregar ideias do usuário (todas) e depois separar as recentes
        const ideas = await SupabaseService.getIdeasByUser(user.id)
        setAllUserIdeas(ideas)
        setUserIdeas(ideas.slice(0, 3)) // Últimas 3 ideias

        // Carregar ranking e tentativas de quiz
        const [ranking, attempts] = await Promise.all([
          SupabaseService.getRanking(50),
          SupabaseService.getQuizAttemptsByUser(user.id)
        ])
        setRankingUsers(ranking)
        const userPosition = ranking.findIndex(u => u.id === user.id) + 1
        setUserRanking(userPosition)
        setQuizzesCompleted((attempts || []).length)
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  if (!user) return null

  const recentIdeas = userIdeas

  // Badges calculadas com base em dados reais (mesma lógica do Perfil)
  const approvedIdeas = allUserIdeas.filter(idea => idea.status === 'aprovado').length
  const userBadges = [
    { name: 'Primeira Ideia', icon: 'lightbulb', earned: allUserIdeas.length > 0 },
    { name: 'Quiz Master', icon: 'trophy', earned: quizzesCompleted >= 3 },
    { name: 'Inovador', icon: 'star', earned: approvedIdeas >= 3 },
    { name: 'Colaborador Engajado', icon: 'star', earned: allUserIdeas.length >= 10 },
    { name: 'Líder', icon: 'trophy', earned: userRanking <= 5 && userRanking > 0 },
  ]

  const earnedBadges = userBadges.filter(badge => badge.earned)

  // Próximo nível de pontos
  const nextLevel = Math.ceil(user.points / 500) * 500
  const progressToNext = ((user.points % 500) / 500) * 100

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="eurolytics-gradient rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <img src={EurolyticsLogo} alt="Eurolytics" className="h-10 w-10 mb-4" />
            <h1 className="text-4xl font-bold mb-3 flex items-center space-x-3">
              <span>Olá, {user.full_name.split(' ')[0]}!</span>
              <span className="text-5xl">👋</span>
            </h1>
            <p className="text-blue-100 mb-6 text-lg">
              Bem-vindo de volta à plataforma de inovação da Eurofarma ✨
            </p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <Trophy className="h-6 w-6 text-yellow-300" />
                <span className="font-semibold text-lg">{formatPoints(user.points)}</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <Users className="h-6 w-6 text-green-300" />
                <span className="font-semibold text-lg">#{userRanking} no ranking</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400/50 to-amber-500/50 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
              <Star className="h-12 w-12 text-yellow-300 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="eurolytics-stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-gray-700">Minhas Ideias</CardTitle>
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">{allUserIdeas.length}</div>
            <p className="text-sm text-gray-600">
              {approvedIdeas} aprovadas ✅
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Conquistadas</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnedBadges.length}</div>
            <p className="text-xs text-muted-foreground">
              de {userBadges.length} disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posição no Ranking</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{userRanking}</div>
            <p className="text-xs text-muted-foreground">
              de colaboradores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Nível</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nextLevel}</div>
            <Progress value={progressToNext} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {nextLevel - user.points} pontos restantes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Ideas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Minhas Ideias Recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/ideias">
                Ver todas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentIdeas.length > 0 ? (
              <div className="space-y-4">
                {recentIdeas.map((idea) => (
                  <div key={idea.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{idea.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(idea.created_at)} • {idea.category}
                      </p>
                    </div>
                    <Badge 
                      className={
                        idea.status === 'aprovado' ? 'bg-green-500 text-white hover:bg-green-600' :
                        idea.status === 'rejeitado' ? 'bg-red-500 text-white hover:bg-red-600' :
                        'bg-yellow-500 text-white hover:bg-yellow-600'
                      }
                    >
                      {idea.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Você ainda não submeteu nenhuma ideia</p>
                <Button asChild>
                  <Link to="/ideias">Submeter Primeira Ideia</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projetos Ativos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Projetos Ativos</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/projetos">
                Ver projetos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-white/70">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span>Pipeline de Inovação</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">Acompanhe os projetos em andamento</p>
              </div>
              <div className="p-4 rounded-lg border bg-white/70">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4 text-green-600" />
                  <span>Equipes engajadas</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">Veja quem está liderando</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Minhas Badges</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/perfil">
                Ver perfil <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {userBadges.map((badge) => (
                <div 
                  key={badge.name}
                  className={`p-4 rounded-lg border text-center ${
                    badge.earned ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    badge.earned ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {badge.icon === 'lightbulb' && <Lightbulb className="h-4 w-4" />}
                    {badge.icon === 'trophy' && <Trophy className="h-4 w-4" />}
                    {badge.icon === 'star' && <Star className="h-4 w-4" />}
                  </div>
                  <h4 className={`text-xs font-medium ${badge.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                    {badge.name}
                  </h4>
                  {!badge.earned && (
                    <p className="text-xs text-gray-400 mt-1">Bloqueada</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mini Ranking */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ranking (Top 5)</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/ranking">
                Ver ranking <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankingUsers.slice(0, 5).map((u, idx) => (
                <div key={u.id} className={`flex items-center justify-between p-2 rounded-lg ${u.id === user.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-yellow-500 text-white' : idx === 1 ? 'bg-gray-400 text-white' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{u.full_name}</div>
                      <div className="text-xs text-gray-500">{u.department}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${u.id === user.id ? 'text-blue-600' : 'text-gray-800'}`}>{formatPoints(u.points)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card Nova Ideia */}
            <Link to="/ideias" className="group h-full">
              <div className="relative h-full overflow-hidden bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <Lightbulb className="h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold mb-1">Submeter Nova Ideia</h3>
                    <p className="text-sm opacity-90">Compartilhe sua inovação</p>
                  </div>
                  <div className="flex items-center space-x-1 text-sm">
                    <span className="font-semibold">+50</span>
                    <span className="opacity-80">pontos</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 w-3 h-3 bg-white/30 rounded-full animate-pulse"></div>
              </div>
            </Link>

            {/* Card Quiz */}
            <Link to="/quizzes" className="group h-full">
              <div className="relative h-full overflow-hidden bg-gradient-to-br from-blue-500 via-blue-800 to-indigo-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <Trophy className="h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold mb-1">Fazer Quiz</h3>
                    <p className="text-sm opacity-90">Teste seus conhecimentos</p>
                  </div>
                  <div className="flex items-center space-x-1 text-sm">
                    <span className="font-semibold">+25</span>
                    <span className="opacity-80">pontos</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 w-3 h-3 bg-white/30 rounded-full animate-pulse"></div>
              </div>
            </Link>

            {/* Card Ranking */}
            <Link to="/ranking" className="group h-full">
              <div className="relative h-full overflow-hidden bg-gradient-to-br from-cyan-500 via-cyan-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <Users className="h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold mb-1">Ver Ranking</h3>
                    <p className="text-sm opacity-90">Compare sua posição</p>
                  </div>
                  <div className="flex items-center space-x-1 text-sm">
                    <span className="font-semibold">Top 10</span>
                    <span className="opacity-80">ranking</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 w-3 h-3 bg-white/30 rounded-full animate-pulse"></div>
              </div>
            </Link>

            {/* Card Ver Projetos */}
            <Link to="/projetos" className="group h-full">
              <div className="relative h-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold mb-1">Ver Projetos</h3>
                    <p className="text-sm opacity-90">Acompanhe iniciativas ativas</p>
                  </div>
                </div>
                <div className="absolute top-2 right-2 w-3 h-3 bg-white/30 rounded-full animate-pulse"></div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
