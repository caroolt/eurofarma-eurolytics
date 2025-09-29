import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { SupabaseService } from '../lib/supabaseService'
import type { Idea, User } from '../types/index'
import { 
  Trophy, 
  Star, 
  Target, 
  TrendingUp, 
  Calendar,
  Award,
  Edit3,
  Settings
} from 'lucide-react'

export default function Profile() {
  const { user } = useAuth()
  const [userIdeas, setUserIdeas] = useState<Idea[]>([])
  const [userRanking, setUserRanking] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [freshUser, setFreshUser] = useState<User | null>(null)
  const [quizzesCompleted, setQuizzesCompleted] = useState<number>(0)

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return
      
      try {
        const [ideas, ranking, fresh, attempts] = await Promise.all([
          SupabaseService.getIdeasByUser(user.id),
          SupabaseService.getRanking(50),
          SupabaseService.getUserById(user.id),
          SupabaseService.getQuizAttemptsByUser(user.id)
        ])
        
        setUserIdeas(ideas)
        const userPosition = ranking.findIndex(u => u.id === user.id) + 1
        setUserRanking(userPosition)
        setFreshUser(fresh)
        setQuizzesCompleted((attempts || []).length)
      } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProfileData()
  }, [user])

  if (!user) return null

  const pointsToShow = freshUser?.points ?? user.points
  const badges = [
    { id: 1, name: 'Primeira Ideia', description: 'Submeteu sua primeira ideia', icon: '💡', earned: userIdeas.length > 0 },
    { id: 2, name: 'Quiz Master', description: 'Completou 3 quizzes', icon: '🧠', earned: quizzesCompleted >= 3 },
    { id: 3, name: 'Inovador', description: '3 ideias aprovadas', icon: '🚀', earned: userIdeas.filter(idea => idea.status === 'aprovado').length >= 3 },
    { id: 4, name: 'Colaborador', description: 'Participou de 10 atividades', icon: '🤝', earned: userIdeas.length >= 10 },
    { id: 5, name: 'Líder', description: 'Top 5 no ranking', icon: '👑', earned: userRanking <= 5 && userRanking > 0 },
  ]

  const earnedBadges = badges.filter(badge => badge.earned)
  const approvedIdeas = userIdeas.filter(idea => idea.status === 'aprovado').length
  const nextLevel = Math.ceil(pointsToShow / 500) * 500
  const progressToNext = ((pointsToShow % 500) / 500) * 100

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header do Perfil */}
      <div className="eurolytics-gradient rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10"></div>
        <div className="relative z-10 flex items-center space-x-6">
          <Avatar className="w-24 h-24 border-4 border-white/20">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="text-2xl font-bold bg-white/20">
              {user.full_name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{freshUser?.full_name || user.full_name}</h1>
            <p className="text-lg opacity-90 mb-2">{user.department}</p>
            <div className="flex items-center space-x-4">
              <Badge className="bg-white/20 text-white border-white/30">
                {user.role === 'colaborador' ? 'Colaborador' : 
                 user.role === 'gestor' ? 'Gestor' : 'Executivo'}
              </Badge>
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span className="text-xl font-bold">{pointsToShow.toLocaleString()}</span>
                <span className="opacity-80">pontos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estatísticas */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Estatísticas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{userIdeas.length}</div>
                  <div className="text-sm text-gray-600">Ideias Submetidas</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{approvedIdeas}</div>
                  <div className="text-sm text-gray-600">Ideias Aprovadas</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">{quizzesCompleted}</div>
                  <div className="text-sm text-gray-600">Quizzes Completos</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <div className="text-2xl font-bold text-orange-600">{userRanking > 0 ? `${userRanking}º` : '-'}</div>
                  <div className="text-sm text-gray-600">Posição no Ranking</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progresso do Nível */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Progresso do Nível</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Nível Atual: {Math.floor(pointsToShow / 500) + 1}</span>
                  <span className="text-sm text-gray-600">{pointsToShow} / {nextLevel} pontos</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressToNext}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Próximo nível em {nextLevel - pointsToShow} pontos</span>
                  <span>{Math.round(progressToNext)}% completo</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Badges ({earnedBadges.length}/{badges.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {badges.map((badge) => (
                  <div 
                    key={badge.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      badge.earned 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      badge.earned ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {badge.earned ? badge.icon : '🔒'}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        badge.earned ? 'text-green-800' : 'text-gray-500'
                      }`}>
                        {badge.name}
                      </div>
                      <div className={`text-sm ${
                        badge.earned ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {badge.description}
                      </div>
                    </div>
                    {badge.earned && (
                      <Star className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Atividade Recente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Atividade Recente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userIdeas.slice(0, 5).map((idea, index) => (
                  <div key={idea.id} className="flex items-center space-x-3 p-2">
                    <div className={`w-2 h-2 rounded-full ${
                      idea.status === 'aprovado' ? 'bg-green-500' :
                      idea.status === 'rejeitado' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm">
                      Ideia "{idea.title.length > 30 ? idea.title.substring(0, 30) + '...' : idea.title}" {idea.status}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(idea.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
                {userIdeas.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p>Nenhuma atividade recente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
