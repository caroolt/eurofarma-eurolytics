import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { 
  Plus, 
  Search, 
  Filter,
  Lightbulb,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { SupabaseService } from '../lib/supabaseService'
import { formatDate, formatPoints } from '../lib/utils'
import { useToast } from '../hooks/useToast'
import type { Idea } from '../types/index'

export default function Ideas() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showNewIdeaForm, setShowNewIdeaForm] = useState(false)
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    category: 'Processo',
    proposeProject: false,
    projectMax: 8
  })

  if (!user) return null

  const [userIdeas, setUserIdeas] = useState<Idea[]>([])
  const [_, setLoading] = useState(true)

  useEffect(() => {
    const loadUserIdeas = async () => {
      if (!user) return
      
      try {
        const ideas = await SupabaseService.getIdeasByUser(user.id)
        setUserIdeas(ideas)
      } catch (error) {
        console.error('Erro ao carregar ideias:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar suas ideias',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadUserIdeas()
  }, [user, toast])

  // Debounce do termo de busca
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250)
    return () => clearTimeout(id)
  }, [searchTerm])

  // Aplicar termo vindo da barra de busca global (?q=)
  useEffect(() => {
    const q = searchParams.get('q') || ''
    if (q) setSearchTerm(q)
    const openNew = searchParams.get('new')
    if (openNew === '1') {
      setShowNewIdeaForm(true)
    }
  }, [searchParams])

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '')
      .trim()
  
  const filteredIdeas = userIdeas.filter(idea => {
    const nTitle = normalize(idea.title)
    const nDesc = normalize(idea.description)
    const nSearch = normalize(debouncedSearch)
    const matchesSearch = !nSearch || nTitle.includes(nSearch) || nDesc.includes(nSearch)
    const matchesFilter = filterStatus === 'all' || idea.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleSubmitIdea = async () => {
    if (!newIdea.title.trim() || !newIdea.description.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a descrição da ideia.",
        variant: "destructive"
      })
      return
    }

    try {
      await SupabaseService.createIdea({
        user_id: user!.id,
        title: newIdea.title,
        description: newIdea.description,
        category: newIdea.category,
        status: 'pendente',
        points_awarded: 0,
        ...(newIdea.proposeProject ? { propose_project: true, project_max: newIdea.projectMax } as any : {})
      })

      toast({
        title: "Ideia submetida com sucesso!",
        description: "Sua ideia foi enviada para análise. Você receberá uma notificação quando for avaliada.",
        variant: "success"
      })

      setNewIdea({ title: '', description: '', category: 'Processo', proposeProject: false, projectMax: 8 })
      setShowNewIdeaForm(false)
      
      // Recarregar ideias
      const ideas = await SupabaseService.getIdeasByUser(user!.id)
      setUserIdeas(ideas)
    } catch (error) {
      console.error('Erro ao submeter ideia:', error)
      toast({
        title: "Erro",
        description: "Não foi possível submeter sua ideia",
        variant: "destructive"
      })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Ideias</h1>
          <p className="text-gray-600">Gerencie suas ideias de inovação</p>
        </div>
        <Button onClick={() => setShowNewIdeaForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ideia
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{userIdeas.length}</p>
                <p className="text-sm text-gray-600">Total de Ideias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {userIdeas.filter(i => i.status === 'aprovado').length}
                </p>
                <p className="text-sm text-gray-600">Aprovadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {userIdeas.filter(i => i.status === 'pendente').length}
                </p>
                <p className="text-sm text-gray-600">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">P</span>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {userIdeas.reduce((sum, idea) => sum + idea.points_awarded, 0)}
                </p>
                <p className="text-sm text-gray-600">Pontos Ganhos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Idea Form */}
      {showNewIdeaForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Ideia de Inovação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Título</label>
              <Input
                placeholder="Digite um título claro e descritivo"
                value={newIdea.title}
                onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={newIdea.category}
                onChange={(e) => setNewIdea({ ...newIdea, category: e.target.value })}
              >
                <option value="Processo">Processo</option>
                <option value="Produto">Produto</option>
                <option value="Sustentabilidade">Sustentabilidade</option>
                <option value="Tecnologia">Tecnologia</option>
                <option value="Segurança">Segurança</option>
                <option value="Qualidade">Qualidade</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={newIdea.proposeProject} onChange={(e) => setNewIdea({ ...newIdea, proposeProject: e.target.checked })} />
                Transformar em projeto ao aprovar
              </label>
              <div>
                <label className="text-sm font-medium mb-2 block">Limite de participantes</label>
                <Input type="number" min={2} max={50} value={newIdea.projectMax}
                  onChange={(e) => setNewIdea({ ...newIdea, projectMax: Number(e.target.value) })} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Descrição</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md h-32 resize-none"
                placeholder="Descreva sua ideia em detalhes. Inclua o problema que ela resolve, como implementar e quais benefícios esperados..."
                value={newIdea.description}
                onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleSubmitIdea}>
                Submeter Ideia
              </Button>
              <Button variant="outline" onClick={() => setShowNewIdeaForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar ideias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                className="p-2 border border-gray-300 rounded-md"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
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
        {filteredIdeas.length > 0 ? (
          filteredIdeas.map((idea) => (
            <Card key={idea.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">{idea.title}</h3>
                      {getStatusIcon(idea.status)}
                    </div>
                    <p className="text-gray-600 mb-4">{idea.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(idea.created_at)}</span>
                      </div>
                      <Badge variant="outline">{idea.category}</Badge>
                      {idea.points_awarded > 0 && (
                        <Badge variant="secondary">
                          +{formatPoints(idea.points_awarded)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant={getStatusColor(idea.status) as any}>
                    {idea.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {userIdeas.length === 0 ? 'Nenhuma ideia ainda' : 'Nenhuma ideia encontrada'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {userIdeas.length === 0 
                    ? 'Comece submetendo sua primeira ideia de inovação!'
                    : 'Tente ajustar os filtros de busca.'
                  }
                </p>
                {userIdeas.length === 0 && (
                  <Button onClick={() => setShowNewIdeaForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Submeter Primeira Ideia
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
