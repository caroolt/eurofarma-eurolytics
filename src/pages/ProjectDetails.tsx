import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/AuthContext'
import { SupabaseService } from '../lib/supabaseService'
import type { Project } from '../types/index'
import { Users, TrendingUp, ArrowLeft, Calendar, Building2 } from 'lucide-react'
import { useToast } from '../hooks/useToast'

export default function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [participants, setParticipants] = useState<string[]>([])
  const [participantUsers, setParticipantUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const list = await SupabaseService.getProjects()
        const found = list.find((p) => (p as any).id === id) || null
        setProject(found as any)
        if (id) {
          const users = await SupabaseService.getProjectParticipants(id)
          const ids = users.map((u: any) => u.id)
          setParticipants(ids)
          setParticipantUsers(users as any)
        }
      } catch (e) {
        console.error('Erro ao carregar projeto', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64">Carregando...</div>
  if (!project) return <div className="p-6">Projeto não encontrado.</div>

  const statusNorm = String((project as any).status || '').toLowerCase().trim()
  const isManager = (project as any).manager_id === user?.id
  const isIn = participants.includes(user!.id)
  const capacity = (project as any).max_participants || 8
  const isFull = participants.length >= capacity

  const handleJoin = async () => {
    if (!id || !user) return
    try {
      setJoining(true)
      await SupabaseService.addParticipant(id, user.id)
      // Recarregar participantes após entrada
      const updatedUsers = await SupabaseService.getProjectParticipants(id)
      setParticipants(updatedUsers.map((u: any) => u.id))
      setParticipantUsers(updatedUsers as any)
      await SupabaseService.updateUserPoints(user.id, (user.points || 0) + 20)
      toast({ title: 'Participação confirmada', description: 'Você ganhou +20 pontos.', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Erro ao participar', description: e?.message || 'Tente novamente.', variant: 'destructive' })
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              {(project as any).title || (project as any).name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">{(project as any).description}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>Participantes: {participants.length}/{capacity}</span>
              {(project as any).department && (
                <>
                  <Building2 className="h-4 w-4" />
                  <Badge variant="outline">{(project as any).department}</Badge>
                </>
              )}
              <Calendar className="h-4 w-4" />
              <span>Atualizado: {new Date((project as any).updated_at || (project as any).created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Status: {(project as any).status || 'ativo'}</Badge>
              {(project as any).justification && (
                <Badge variant="outline">Justificativa: {(project as any).justification}</Badge>
              )}
            </div>

            <div className="pt-2">
              <Button
                disabled={isIn || isFull || isManager || joining || statusNorm === 'concluido'}
                className="cursor-pointer disabled:cursor-not-allowed"
                onClick={handleJoin}
              >
                { statusNorm === 'concluido' ? 'Projeto concluído' : (isIn ? 'Você já participa' : isFull ? 'Projeto cheio' : isManager ? 'Você é gestor' : (joining ? 'Entrando...' : 'Participar do projeto')) }
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Participantes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Participantes ({participants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {participantUsers.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum participante.</p>
              ) : (
                participantUsers.map((u: any, idx: number) => (
                  <div key={`${u?.id || u?.user_id || 'p'}-${idx}`} className="flex items-center justify-between p-2 rounded-md border">
                    <div>
                      <div className="font-medium">{u.full_name}</div>
                      <div className="text-xs text-gray-500">{u.department}</div>
                    </div>
                    <Badge variant="outline">{u.role}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


