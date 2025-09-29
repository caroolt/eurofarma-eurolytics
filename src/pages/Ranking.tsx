import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { 
  Trophy, 
  Medal, 
  Award,
  Users,
  TrendingUp,
  Crown,
  Star
} from 'lucide-react'
import { SupabaseService } from '../lib/supabaseService'
import type { User } from '../types/index'
import { getInitials, formatPoints } from '../lib/utils'

export default function Ranking() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('geral')
  const [selectedDepartment, setSelectedDepartment] = useState('todos')
  const [users, setUsers] = useState<User[]>([])
  const [periodPoints, setPeriodPoints] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRanking = async () => {
      try {
        const rankingUsers = await SupabaseService.getRanking(50)
        setUsers(rankingUsers)

        // Calcular pontos por período
        if (selectedPeriod !== 'geral') {
          const days = selectedPeriod === 'mensal' ? 30 : 7
          const ideas = await SupabaseService.getIdeasSince(days)
          const byUser: Record<string, number> = {}
          for (const idea of ideas) {
            const pts = Number(idea.points_awarded || 0)
            byUser[idea.user_id] = (byUser[idea.user_id] || 0) + pts
          }
          setPeriodPoints(byUser)
        } else {
          setPeriodPoints({})
        }
      } catch (error) {
        console.error('Erro ao carregar ranking:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRanking()
  }, [selectedPeriod])

  if (!user) return null

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando ranking...</div>
  }

  // Ordenar usuários por pontos (período ou geral)
  const sortedUsers = [...users].sort((a, b) => {
    if (selectedPeriod === 'geral') return b.points - a.points
    const aPts = periodPoints[a.id] || 0
    const bPts = periodPoints[b.id] || 0
    return bPts - aPts
  })
  
  // Filtrar por departamento se selecionado
  const filteredUsers = selectedDepartment === 'todos' 
    ? sortedUsers 
    : sortedUsers.filter(u => u.department === selectedDepartment)

  const topUsers = filteredUsers.slice(0, 10)
  const userPosition = filteredUsers.findIndex(u => u.id === user.id) + 1

  // Pontos consistentes com Supabase/período para o usuário logado
  const currentUserFetched = users.find(u => u.id === user.id)
  const currentUserDisplayPoints = selectedPeriod === 'geral'
    ? (currentUserFetched?.points ?? user.points)
    : (periodPoints[user.id] || 0)

  // Estatísticas por departamento
  const departmentStats = Object.entries(
    users.reduce((acc, user) => {
      acc[user.department] = (acc[user.department] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .map(([dept, count]) => ({
      department: dept,
      users: count,
      totalPoints: users
        .filter(u => u.department === dept)
        .reduce((sum, u) => sum + u.points, 0),
      avgPoints: Math.round(users
        .filter(u => u.department === dept)
        .reduce((sum, u) => sum + u.points, 0) / count)
    }))
    .sort((a, b) => b.avgPoints - a.avgPoints)

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return (
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-gray-600">{position}</span>
          </div>
        )
    }
  }

  const getRankBadgeColor = (position: number) => {
    if (position <= 3) return 'success'
    if (position <= 10) return 'secondary'
    return 'outline'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ranking de Inovação</h1>
          <p className="text-gray-600">Veja como você está se saindo comparado aos colegas</p>
        </div>
      </div>

      {/* User Position Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {getRankIcon(userPosition)}
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-600 text-white">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Sua Posição</h3>
              <p className="text-gray-600">{user.full_name} • {user.department}</p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant={getRankBadgeColor(userPosition) as any}>
                  #{userPosition} de {filteredUsers.length}
                </Badge>
                <span className="font-semibold text-blue-600">
                  {formatPoints(currentUserDisplayPoints)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <select
                className="p-2 border border-gray-300 rounded-md"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="geral">Geral</option>
                <option value="mensal">Este Mês</option>
                <option value="semanal">Esta Semana</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Departamento</label>
              <select
                className="p-2 border border-gray-300 rounded-md"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="todos">Todos os Departamentos</option>
                {Array.from(new Set(users.map(u => u.department))).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 10 Ranking */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span>Top 10 Colaboradores</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topUsers.map((rankUser, index) => {
                  const position = index + 1
                  const isCurrentUser = rankUser.id === user.id
                  
                  return (
                    <div
                      key={rankUser.id}
                      className={`flex items-center space-x-4 p-3 rounded-lg ${
                        isCurrentUser ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {getRankIcon(position)}
                        <Avatar>
                          <AvatarFallback className={
                            isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                          }>
                            {getInitials(rankUser.full_name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`font-medium ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'}`}>
                            {rankUser.full_name}
                          </h4>
                          {isCurrentUser && <Badge variant="secondary">Você</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">{rankUser.department}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={getRankBadgeColor(position) as any}>
                            {rankUser.role}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-semibold ${isCurrentUser ? 'text-blue-600' : 'text-gray-900'}`}>
                          {selectedPeriod === 'geral' 
                            ? formatPoints(rankUser.points)
                            : formatPoints(periodPoints[rankUser.id] || 0)}
                        </p>
                        {position <= 3 && (
                          <div className="flex items-center justify-end space-x-1 mt-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-yellow-600">Top 3</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Stats */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Ranking por Departamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentStats.map((dept) => (
                  <div key={dept.department} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm">{dept.department}</h4>
                      <p className="text-xs text-gray-600">{dept.users} colaboradores</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatPoints(dept.avgPoints)}</p>
                      <p className="text-xs text-gray-600">média</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Estatísticas Gerais</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total de Colaboradores</span>
                  <span className="font-semibold">{users.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Colaboradores Ativos</span>
                  <span className="font-semibold">{users.filter(u => u.points > 0).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pontuação Média</span>
                  <span className="font-semibold">
                    {formatPoints(Math.round(users.reduce((sum, u) => sum + u.points, 0) / users.length))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Maior Pontuação</span>
                  <span className="font-semibold text-green-600">
                    {formatPoints(Math.max(...users.map(u => u.points)))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
