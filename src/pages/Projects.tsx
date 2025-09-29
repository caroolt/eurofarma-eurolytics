import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { SupabaseService } from '../lib/supabaseService'
import type { Project } from '../types/index'
import { Search, Users, Calendar, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { useToast } from '../hooks/useToast'

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [processing, setProcessing] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({})
  const [userInProject, setUserInProject] = useState<Record<string, boolean>>({})

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
        const roleFiltered = data
        setProjects(roleFiltered)

        const counts: Record<string, number> = {}
        const mine: Record<string, boolean> = {}
        for (const p of roleFiltered as any[]) {
          try {
            const parts = await SupabaseService.getProjectParticipants((p as any).id)
            counts[(p as any).id] = parts.length
            mine[(p as any).id] = parts.some((x: any) => x.id === user!.id)
          } catch {}
        }
        setParticipantCounts(counts)
        setUserInProject(mine)
      } catch (e) {
        console.error('Erro ao carregar projetos', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (!user) return null

  const normalize = (t: string) => t.toLowerCase().normalize('NFD').replace(/\p{Diacritic}+/gu, '').trim()
  const filtered = projects.filter((p: any) => {
    const q = normalize(searchTerm)
    if (!q) return true
    const title = p.title || p.name || ''
    return normalize(title).includes(q) || normalize(p.description || '').includes(q) || normalize(p.users?.full_name || '').includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projetos de Inovação</h1>
          <p className="text-gray-600">Acompanhe iniciativas em andamento e resultados</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar projetos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-sm text-gray-600">Projetos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{new Set(projects.map((p: any) => p.manager_id)).size}</p>
                <p className="text-sm text-gray-600">Gestores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{projects.filter((p: any) => (p.status || 'ativo') !== 'concluido').length}</p>
                <p className="text-sm text-gray-600">Em andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Carregando projetos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((p: any) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="text-lg">{p.title || p.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3 line-clamp-3">{p.description}</p>
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                  <Users className="h-4 w-4" />
                  <span>Gestor: {p.users?.full_name || '—'}</span>
                  <span className="ml-2">Participantes: {participantCounts[p.id] ?? 0}/{p.max_participants || 8}</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={getStatusBadgeClass(p.status)}>Status: {p.status || 'ativo'}</Badge>
                  {p.department && <Badge variant="outline">{p.department}</Badge>}
                </div>
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    className="group transition-all hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                    onClick={() => window.location.assign(`/projetos/${p.id}`)}
                  >
                    <span className="inline-flex items-center">Ver Detalhes <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
                  </Button>
                  <Button 
                    size="sm"
                    className="cursor-pointer disabled:cursor-not-allowed"
                    disabled={
                      !!processing[p.id] ||
                      userInProject[p.id] ||
                      (participantCounts[p.id] ?? 0) >= (p.max_participants || 0) ||
                      p.manager_id === user!.id ||
                      (p.status === 'concluido')
                    }
                    onClick={async () => {
                      try {
                        setProcessing(prev => ({ ...prev, [p.id]: true }))
                        await SupabaseService.addParticipant(p.id, user!.id)
                        toast({ title: 'Participação confirmada', description: 'Você entrou no projeto e ganhou +20 pontos.', variant: 'success' })
                        setUserInProject(prev => ({ ...prev, [p.id]: true }))
                        setParticipantCounts(prev => ({ ...prev, [p.id]: (prev[p.id] ?? 0) + 1 }))
                      } catch (e: any) {
                        console.error('Falha ao participar do projeto', e)
                        toast({ title: 'Não foi possível participar', description: e?.message || 'Tente novamente mais tarde.', variant: 'destructive' })
                      } finally {
                        setProcessing(prev => ({ ...prev, [p.id]: false }))
                      }
                    }}
                  >
                    {p.status === 'concluido' ? (
                      <>Projeto concluído</>
                    ) : userInProject[p.id] ? (
                      <>Já está participando</>
                    ) : (processing[p.id] ? (
                      <>
                        <span className="mr-2 inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        Entrando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" /> Participar
                      </>
                    ))}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


