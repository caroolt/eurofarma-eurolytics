import { supabase } from './supabase'
import type { User, Idea, Quiz, QuizQuestion, QuizAttempt, UserBadgeType, UserBadge, Project } from '../types/index'

// Serviço para gerenciar dados do Supabase
export class SupabaseService {
  // Usuários
  static async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('points', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) throw error
    return data
  }

  // Verificação de senha via função RPC (verify_user_password)
  static async verifyUserPassword(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabase.rpc('verify_user_password', {
      p_email: email,
      p_password: password
    })
    if (error) return null
    return data as User
  }

  // Ideias
  static async getIdeas(): Promise<Idea[]> {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getIdeasByUser(userId: string): Promise<Idea[]> {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Novidade: buscar ideias desde uma data para cálculo de ranking por período
  static async getIdeasSince(daysAgo: number): Promise<Pick<Idea, 'user_id' | 'points_awarded' | 'created_at'>[]> {
    const since = new Date()
    since.setDate(since.getDate() - daysAgo)

    const { data, error } = await supabase
      .from('ideas')
      .select('user_id, points_awarded, created_at')
      .gte('created_at', since.toISOString())

    if (error) {
      console.error('Erro ao buscar ideias por período:', error)
      return []
    }

    return (data || []) as any
  }

  static async createIdea(idea: Omit<Idea, 'id' | 'created_at' | 'updated_at'>): Promise<Idea> {
    const { data, error } = await supabase
      .from('ideas')
      .insert([idea])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateIdeaStatus(id: string, status: 'pendente' | 'aprovado' | 'rejeitado', points_awarded: number = 0): Promise<Idea> {
    const { data, error } = await supabase
      .from('ideas')
      .update({ 
        status, 
        points_awarded,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Quizzes
  static async getQuizzes(): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        quiz_questions (*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getQuizById(id: string): Promise<Quiz | null> {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        quiz_questions (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  // Tentativas de Quiz
  static async createQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'completed_at'>): Promise<QuizAttempt> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert([attempt])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        quizzes (*)
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Badges
  static async getBadges(): Promise<UserBadgeType[]> {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('points_required', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badges (*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    const { data, error } = await supabase
      .from('user_badges')
      .insert([{ user_id: userId, badge_id: badgeId }])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Projetos
  static async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        users!projects_manager_id_fkey (full_name, department)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async createProjectFromIdea(idea: { title: string, description: string, user_id: string, department?: string, max_participants?: number }): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ 
        title: idea.title,
        description: idea.description,
        manager_id: idea.user_id,
        department: idea.department || null,
        max_participants: idea.max_participants || 8,
        status: 'ativo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select(`
        *,
        users!projects_manager_id_fkey (full_name, department)
      `)
      .single()
    if (error) throw error
    return data as Project
  }

  static async addParticipant(projectId: string, userId: string): Promise<void> {
    // Checar status e limite e adicionar
    const { data: proj } = await supabase.from('projects').select('id, max_participants, status').eq('id', projectId).single()
    if (proj?.status === 'concluido') throw new Error('Projeto concluído não aceita novos participantes')
    const { data: participants } = await supabase.from('project_participants').select('id').eq('project_id', projectId)
    if ((participants?.length || 0) >= (proj?.max_participants || 0)) throw new Error('Limite de participantes atingido')
    const { error } = await supabase.from('project_participants').insert([{ project_id: projectId, user_id: userId }])
    if (error) throw error
  }

  static async getProjectParticipants(projectId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('project_participants')
      .select(`
        users:users!project_participants_user_id_fkey (id, full_name, department, role)
      `)
      .eq('project_id', projectId)
    if (error) throw error
    // Mapear para o objeto usuário direto
    return ((data || []) as any[]).map((row) => row.users).filter(Boolean) as User[]
  }

  static async getUsersByIds(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return []
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds)
    if (error) throw error
    return (data || []) as User[]
  }

  static async getProjectsByManager(managerId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        users!projects_manager_id_fkey (full_name, department)
      `)
      .eq('manager_id', managerId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async updateProjectStatus(projectId: string, status: string, justification?: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({ status, justification: justification || null, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .select(`
        *,
        users!projects_manager_id_fkey (full_name, department)
      `)
      .single()
    if (error) throw error
    return data as Project
  }

  // Analytics
  static async getAnalytics() {
    // Total de ideias
    const { count: totalIdeas } = await supabase
      .from('ideas')
      .select('*', { count: 'exact', head: true })

    // Ideias por status
    const { data: ideasByStatus } = await supabase
      .from('ideas')
      .select('status')
    
    const approvedIdeas = ideasByStatus?.filter(i => i.status === 'aprovado').length || 0
    const pendingIdeas = ideasByStatus?.filter(i => i.status === 'pendente').length || 0
    const rejectedIdeas = ideasByStatus?.filter(i => i.status === 'rejeitado').length || 0

    // Total de usuários
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Usuários ativos (com pontos > 0)
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('points', 0)

    // Estatísticas por departamento
    const { data: users } = await supabase
      .from('users')
      .select('department')
    
    const departmentStats = users?.reduce((acc, user) => {
      acc[user.department] = (acc[user.department] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Top usuários
    const { data: topUsers } = await supabase
      .from('users')
      .select('id, full_name, points, department')
      .order('points', { ascending: false })
      .limit(10)

    return {
      totalIdeas,
      approvedIdeas,
      pendingIdeas,
      rejectedIdeas,
      totalUsers,
      activeUsers,
      departmentStats,
      topUsers: topUsers || []
    }
  }

  // Ranking
  static async getRanking(limit: number = 10): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('points', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }

  // Atualizar pontos do usuário
  static async updateUserPoints(userId: string, points: number): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ points })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Registro de usuário via RPC (valida domínio e cria hash)
  static async registerUser(params: { email: string, password: string, full_name: string, department: string, role?: string }): Promise<User> {
    const { data, error } = await supabase.rpc('create_user_with_password', {
      p_email: params.email,
      p_password: params.password,
      p_full_name: params.full_name,
      p_department: params.department,
      p_role: params.role || 'colaborador'
    })
    if (error) throw error
    return data as unknown as User
  }
}
