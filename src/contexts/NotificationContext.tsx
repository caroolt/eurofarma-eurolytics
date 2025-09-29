import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { SupabaseService } from '../lib/supabaseService'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  read: boolean
  createdAt: Date
  actionUrl?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return
      const list: Notification[] = []

      // Ideias recentes do usuário (aprovadas/rejeitadas/pendentes)
      try {
        const ideas = await SupabaseService.getIdeasByUser(user.id)
        for (const idea of ideas.slice(0, 5)) {
          if (idea.status === 'aprovado') {
            list.push({
              id: `idea-${idea.id}`,
              title: 'Ideia Aprovada 🎉',
              message: `Sua ideia "${idea.title}" foi aprovada!`,
              type: 'success',
              read: false,
              createdAt: new Date(idea.updated_at || idea.created_at),
              actionUrl: '/ideias'
            })
          } else if (idea.status === 'rejeitado') {
            list.push({
              id: `idea-${idea.id}`,
              title: 'Ideia Rejeitada ❌',
              message: `Sua ideia "${idea.title}" foi rejeitada.`,
              type: 'error',
              read: false,
              createdAt: new Date(idea.updated_at || idea.created_at),
              actionUrl: '/ideias'
            })
          } else {
            list.push({
              id: `idea-${idea.id}`,
              title: 'Ideia em Análise ⏳',
              message: `Sua ideia "${idea.title}" está em análise.`,
              type: 'info',
              read: true,
              createdAt: new Date(idea.created_at),
              actionUrl: '/ideias'
            })
          }
        }
      } catch {}

      // Tentativas de quiz recentes
      try {
        const attempts = await SupabaseService.getQuizAttemptsByUser(user.id)
        for (const att of (attempts as any[]).slice(0, 3)) {
          list.push({
            id: `quiz-${(att as any).id || `${att.quiz_id}-${att.completed_at || ''}`}`,
            title: 'Quiz Concluído 🏆',
            message: `Você concluiu um quiz e ganhou ${(att as any).score ?? 0} pontos.`,
            type: 'info',
            read: false,
            createdAt: new Date((att as any).completed_at || (att as any).created_at || new Date()),
            actionUrl: '/quizzes'
          })
        }
      } catch {}

      // Badges conquistadas
      try {
        const userBadges = await SupabaseService.getUserBadges(user.id)
        for (const ub of (userBadges as any[]).slice(0, 3)) {
          list.push({
            id: `badge-${(ub as any).id || `${(ub as any).badge_id}-${(ub as any).earned_at || ''}`}`,
            title: 'Badge Conquistada 🏅',
            message: `Você conquistou a badge "${(ub as any).badges?.name || 'Nova Badge'}".`,
            type: 'success',
            read: false,
            createdAt: new Date((ub as any).earned_at || (ub as any).awarded_at || new Date()),
            actionUrl: '/perfil'
          })
        }
      } catch {}

      // Ordenar por data desc
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setNotifications(list)
    }

    loadNotifications()
  }, [user])

  const unreadCount = notifications.filter(n => !n.read).length

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      read: false
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
