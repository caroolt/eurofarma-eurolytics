import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '../types/index'
import { SupabaseService } from '../lib/supabaseService'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há um usuário logado no localStorage
    const savedUser = localStorage.getItem('eurolytics-user')
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error('Erro ao parsear usuário salvo:', error)
        localStorage.removeItem('eurolytics-user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      // Simular delay de autenticação
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar credenciais via RPC segura
      const verifiedUser = await SupabaseService.verifyUserPassword(email, password)
      if (!verifiedUser) {
        return { success: false, error: 'Credenciais inválidas' }
      }

      // Salvar usuário no localStorage e no estado
      localStorage.setItem('eurolytics-user', JSON.stringify(verifiedUser))
      setUser(verifiedUser)
      
      return { success: true }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, error: 'Erro interno do servidor' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('eurolytics-user')
    setUser(null)
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
