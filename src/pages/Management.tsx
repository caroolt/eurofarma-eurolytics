import { useState, useEffect, type JSXElementConstructor, type Key, type ReactElement, type ReactNode, type ReactPortal } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { 
  BarChart3, 
  Users, 
  Lightbulb, 
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search
} from 'lucide-react'
import { SupabaseService } from '../lib/supabaseService'
import type { Idea, Project, User } from '../types/index'
import { formatDate, formatPoints } from '../lib/utils'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { useToast } from '../hooks/useToast'

function ManagementDashboard({ analytics, loading }: { analytics: any, loading: boolean }) {
  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>
  }

  if (!analytics) {
    return <div className="text-center text-gray-500">Erro ao carregar dados</div>
  }
  
  const kpis = [
    {
      title: 'Total de Ideias',
      value: analytics.totalIdeas,
      change: '+12%',
      trend: 'up',
      icon: Lightbulb,
      color: 'text-blue-600'
    },
    {
      title: 'Ideias Aprovadas',
      value: analytics.approvedIdeas,
      change: '+8%',
      trend: 'up',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Usuários Ativos',
      value: analytics.activeUsers,
      change: '+15%',
      trend: 'up',
      icon: Users,
      color: 'text-amber-600'
    },
    {
      title: 'Taxa de Aprovação',
      value: `${Math.round((analytics.approvedIdeas / analytics.totalIdeas) * 100)}%`,
      change: '+3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ]

  // Dados para gráficos
  const departmentData = Object.entries(analytics.departmentStats || {}).map(([dept, count]) => ({
    name: dept.length > 15 ? dept.substring(0, 15) + '...' : dept,
    value: count,
    fullName: dept
  }))

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Executivo</h1>
          <p className="text-gray-600">Visão geral dos indicadores de inovação</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Atualizado hoje</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">{kpi.change}</span>
                    </div>
                  </div>
                  <Icon className={`h-8 w-8 ${kpi.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ideias por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Ideias Submetidas por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { month: 'Jan', count: 15 },
                { month: 'Fev', count: 23 },
                { month: 'Mar', count: 31 },
                { month: 'Abr', count: 28 },
                { month: 'Mai', count: 35 },
                { month: 'Jun', count: 42 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Departamento */}
        <Card>
          <CardHeader>
            <CardTitle>Participação por Departamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Colaboradores */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Colaboradores por Pontuação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topUsers?.slice(0, 10).map((topUser: { id: Key | null | undefined; full_name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; department: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; points: number; role: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined }, index: number) => (
              <div key={topUser.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{topUser.full_name}</p>
                    <p className="text-sm text-gray-600">{topUser.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPoints(topUser.points)}</p>
                  <Badge variant="secondary">{topUser.role}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function IdeasManagement() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<Record<string, 'approve' | 'reject' | null>>({})
  const { toast } = useToast()

  useEffect(() => {
    const loadIdeas = async () => {
      try {
        const [allIdeas, allUsers] = await Promise.all([
          SupabaseService.getIdeas(),
          SupabaseService.getRanking(100) // Buscar usuários para mostrar autor
        ])
        setIdeas(allIdeas)
        setUsers(allUsers)
      } catch (error) {
        console.error('Erro ao carregar ideias:', error)
      } finally {
        setLoading(false)
      }
    }

    loadIdeas()
  }, [])
  
  // Debounce de busca
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250)
    return () => clearTimeout(id)
  }, [searchTerm])
  
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '')
      .trim()
  
  const filteredIdeas = ideas.filter(idea => {
    const nTitle = normalize(idea.title)
    const nDesc = normalize(idea.description)
    const nSearch = normalize(debouncedSearch)
    const matchesSearch = !nSearch || nTitle.includes(nSearch) || nDesc.includes(nSearch)
    const matchesStatus = statusFilter === 'all' || idea.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleApproveIdea = async (ideaId: string) => {
    try {
      setProcessing((prev) => ({ ...prev, [ideaId]: 'approve' }))
      // Atualiza status e pontos da ideia
      const updatedIdea = await SupabaseService.updateIdeaStatus(ideaId, 'aprovado', 100)

      // Concede pontos ao autor
      let author: User | null = null
      if (updatedIdea?.user_id && typeof updatedIdea.points_awarded === 'number') {
        try {
          author = await SupabaseService.getUserById(updatedIdea.user_id)
          if (author) {
            const newPoints = (author.points || 0) + (updatedIdea.points_awarded || 0)
            await SupabaseService.updateUserPoints(author.id, newPoints)
          }
        } catch (e) {
          console.error('Falha ao atualizar pontos do usuário:', e)
        }
      }

      // Se a ideia propôs projeto, cria projeto automaticamente
      try {
        if ((updatedIdea as any)?.propose_project) {
          await SupabaseService.createProjectFromIdea({
            title: updatedIdea.title,
            description: updatedIdea.description,
            user_id: updatedIdea.user_id,
            department: (author as any)?.department,
            max_participants: (updatedIdea as any)?.project_max || 8
          })
        }
      } catch (e) {
        console.error('Falha ao criar projeto a partir da ideia', e)
      }

      // Recarregar ideias
      const allIdeas = await SupabaseService.getIdeas()
      setIdeas(allIdeas)
      toast({ title: 'Ideia aprovada', description: 'A ideia foi aprovada e os pontos foram concedidos.', variant: 'success' })
    } catch (error) {
      console.error('Erro ao aprovar ideia:', error)
      toast({ title: 'Erro ao aprovar', description: 'Tente novamente mais tarde.', variant: 'destructive' })
    } finally {
      setProcessing((prev) => ({ ...prev, [ideaId]: null }))
    }
  }

  const handleRejectIdea = async (ideaId: string) => {
    try {
      setProcessing((prev) => ({ ...prev, [ideaId]: 'reject' }))
      await SupabaseService.updateIdeaStatus(ideaId, 'rejeitado', 0)
      // Recarregar ideias
      const allIdeas = await SupabaseService.getIdeas()
      setIdeas(allIdeas)
      toast({ title: 'Ideia rejeitada', description: 'A ideia foi rejeitada.', variant: 'success' })
    } catch (error) {
      console.error('Erro ao rejeitar ideia:', error)
      toast({ title: 'Erro ao rejeitar', description: 'Tente novamente mais tarde.', variant: 'destructive' })
    } finally {
      setProcessing((prev) => ({ ...prev, [ideaId]: null }))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejeitado':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'success'
      case 'rejeitado':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando ideias...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Ideias</h1>
        <p className="text-gray-600">Avalie e gerencie as ideias submetidas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{ideas.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {ideas.filter(i => i.status === 'pendente').length}
              </p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {ideas.filter(i => i.status === 'aprovado').length}
              </p>
              <p className="text-sm text-gray-600">Aprovadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {ideas.filter(i => i.status === 'rejeitado').length}
              </p>
              <p className="text-sm text-gray-600">Rejeitadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar ideias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="aprovado">Aprovado</option>
                <option value="rejeitado">Rejeitado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ideas List */}
      <div className="space-y-4">
        {filteredIdeas.map((idea) => {
          const author = users.find(u => u.id === idea.user_id)
          
          return (
            <Card key={idea.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-base md:text-lg break-words hyphens-auto">
                        {idea.title}
                      </h3>
                      {getStatusIcon(idea.status)}
                    </div>
                    <p className="text-gray-600 mb-3 text-sm md:text-base break-words hyphens-auto">
                      {idea.description}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs md:text-sm text-gray-500 mb-4">
                      <span className="truncate max-w-full">Por: {author?.full_name || 'Usuário desconhecido'}</span>
                      {author?.department && <span className="truncate max-w-full">{author.department}</span>}
                      <span>{formatDate(idea.created_at)}</span>
                      <Badge variant="outline" className="whitespace-nowrap">{idea.category}</Badge>
                    </div>
                    {idea.status === 'pendente' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          variant="eurolytics"
                          onClick={() => handleApproveIdea(idea.id)}
                          className="cursor-pointer disabled:cursor-not-allowed w-full sm:w-auto"
                          disabled={!!processing[idea.id]}
                        >
                          {processing[idea.id] === 'approve' ? (
                            <>
                              <span className="mr-2 inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                              Aprovando...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectIdea(idea.id)}
                          className="cursor-pointer disabled:cursor-not-allowed w-full sm:w-auto"
                          disabled={!!processing[idea.id]}
                        >
                          {processing[idea.id] === 'reject' ? (
                            <>
                              <span className="mr-2 inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                              Rejeitando...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="md:ml-4">
                    <Badge variant={getStatusColor(idea.status) as any} className="self-start whitespace-nowrap">
                      {idea.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function ProjectsManagement() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([] as any)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const { toast } = useToast()
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({})

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'pausado':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'concluido':
        return 'bg-gray-200 text-gray-700 border-gray-300'
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const data = await SupabaseService.getProjects()
        // Filtro por papel: gestor vê somente seu departamento; executivo vê todos
        const roleFiltered = data.filter((p: any) => {
          if (!user) return false
          if (user.role === 'executivo') return true
          if (user.role === 'gestor') return p.department === user.department
          return p.department === user.department // colaboradores: mostrar depto
        })
        setProjects(roleFiltered)

        // Carregar contagem de participantes por projeto
        const counts: Record<string, number> = {}
        for (const p of roleFiltered as any[]) {
          try {
            const parts = await SupabaseService.getProjectParticipants(p.id as any)
            counts[p.id as any] = parts.length
          } catch {}
        }
        setParticipantCounts(counts)
      } catch (e) {
        console.error('Erro ao carregar projetos', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const normalize = (t: string) => t.toLowerCase().normalize('NFD').replace(/\p{Diacritic}+/gu, '').trim()
  const filtered = projects.filter(p => {
    const m = status === 'all' || (p.status || 'ativo') === status
    const q = normalize(search)
    const title = (p as any).title || (p as any).name || ''
    return m && (!q || normalize(title).includes(q) || normalize(p.description || '').includes(q))
  })

  const changeStatus = async (id: string, newStatus: string) => {
    try {
      let justification: string | undefined
      if (newStatus === 'pausado' || newStatus === 'concluido') {
        justification = window.prompt('Informe uma justificativa:') || undefined
      }
      await SupabaseService.updateProjectStatus(id, newStatus, justification)
      const data = await SupabaseService.getProjects()
      setProjects(data)
      toast({ title: 'Status atualizado', description: 'Projeto atualizado com sucesso.', variant: 'success' })
    } catch (e) {
      console.error('Erro ao atualizar status', e)
      toast({ title: 'Erro', description: 'Falha ao atualizar status do projeto.', variant: 'destructive' })
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64">Carregando projetos...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Projetos</h1>
        <p className="text-gray-600">Acompanhe e altere status dos projetos</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar projetos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-2 border border-gray-300 rounded-md">
                <option value="all">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="concluido">Concluído</option>
                <option value="pausado">Pausado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((p) => (
          <Card key={p.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{(p as any).title || (p as any).name}</h3>
                  <p className="text-gray-600 mb-3 line-clamp-3">{p.description}</p>
                  <div className="flex items-center gap-3 mb-3 text-sm text-gray-600">
                    <Badge className={getStatusBadgeClass(p.status)}>{p.status || 'ativo'}</Badge>
                    <span>
                      Participantes: {participantCounts[p.id as any] ?? 0}/{(p as any).max_participants ?? 8}
                    </span>
                    {(p as any).department && <Badge variant="outline">{(p as any).department}</Badge>}
                  </div>
                  <div className="text-sm text-gray-600">Gestor: {(p as any).users?.full_name || '—'}</div>
                </div>
                <div className="space-y-2 ml-4">
                  {/* Botões sensíveis ao status atual */}
                  { ((p as any).status === 'planejamento' || (p as any).status === 'execucao' ? 'ativo' : (p.status || 'ativo')) !== 'ativo' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="cursor-pointer transition-colors hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                      onClick={() => changeStatus(p.id as any, 'ativo')}
                    >
                      Ativar
                    </Button>
                  )}
                  { (p.status !== 'pausado' && p.status !== 'concluido' && p.status !== 'planejamento' && p.status !== 'execucao') && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="cursor-pointer transition-colors hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-700"
                      onClick={() => changeStatus(p.id as any, 'pausado')}
                    >
                      Pausar
                    </Button>
                  )}
                  { ((p as any).status === 'planejamento' || (p as any).status === 'execucao' ? 'ativo' : (p.status || 'ativo')) !== 'concluido' && (
                    <Button 
                      size="sm" 
                      variant="eurolytics" 
                      className="cursor-pointer transition-transform hover:scale-[1.02]"
                      onClick={() => changeStatus(p.id as any, 'concluido')}
                    >
                      Concluir
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function Management() {
  const { user } = useAuth()
  const location = useLocation()
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await SupabaseService.getAnalytics()
        setAnalytics(data)
      } catch (error) {
        console.error('Erro ao carregar analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  if (!user || !['gestor', 'executivo'].includes(user.role)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Acesso negado. Esta área é restrita a gestores e executivos.</p>
      </div>
    )
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link
            to="/gestao"
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              isActive('/gestao')
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Dashboard
          </Link>
          <Link
            to="/gestao/ideias"
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              isActive('/gestao/ideias')
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Lightbulb className="h-4 w-4 inline mr-2" />
            Gestão de Ideias
          </Link>
          <Link
            to="/gestao/projetos"
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              isActive('/gestao/projetos')
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline mr-2" />
            Gestão de Projetos
          </Link>
        </nav>
      </div>

      {/* Route Content */}
      <Routes>
        <Route path="/" element={<ManagementDashboard analytics={analytics} loading={loading} />} />
        <Route path="/ideias" element={<IdeasManagement />} />
        <Route path="/projetos" element={<ProjectsManagement />} />
      </Routes>
    </div>
  )
}
