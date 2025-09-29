// Tipos TypeScript para a aplicação Eurolytics

export interface User {
  id: string
  email: string
  full_name: string
  role: 'colaborador' | 'gestor' | 'executivo'
  department: string
  points: number
  created_at: string
  avatar_url?: string
}

export interface Idea {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
  points_awarded: number
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  title: string
  description: string
  // Em Supabase, as questões vêm como relação 'quiz_questions'. Mantemos ambos para compat.
  questions?: QuizQuestion[]
  quiz_questions?: QuizQuestion[]
  max_points: number
  time_limit: number
  created_at: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: number
  points: number
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_id: string
  score: number
  answers: Record<string, number>
  completed_at: string
}

export interface UserBadgeType {
  id: string
  name: string
  description: string
  icon: string
  requirements: Record<string, any>
  points_required: number
}

export interface UserBadge {
  user_id: string
  badge_id: string
  earned_at: string
}

export interface Project {
  id: string
  title: string
  description: string
  manager_id: string
  status: 'planejamento' | 'execucao' | 'concluido' | 'pausado'
  participants: string[]
  created_at: string
}
