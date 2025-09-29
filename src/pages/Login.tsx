import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useToast } from '../hooks/useToast'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import EurolyticsLogo from '../assets/eurolytics_logo.svg'
import { SupabaseService } from '../lib/supabaseService'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login(email, password)
      
      if (result.success) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo à plataforma Eurolytics.",
          variant: "success"
        })
        navigate('/loading')
      } else {
        toast({
          title: "Erro no login",
          description: result.error || "Credenciais inválidas",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const demoUsers = [
    { email: 'ana.silva@eurofarma.com', role: 'Colaborador' },
    { email: 'carlos.mendes@eurofarma.com', role: 'Gestor' },
    { email: 'maria.santos@eurofarma.com', role: 'Executivo' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo e Header */}
        <div className="text-center">
          <img src={EurolyticsLogo} alt="Eurolytics" className="mx-auto mb-4 h-16 w-16" />
          <h2 className="text-3xl font-bold text-gray-900">Eurolytics</h2>
          <p className="mt-2 text-sm text-gray-600">
            Plataforma de Inovação Corporativa
          </p>
        </div>

        {/* Formulário de Login */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border border-white/30 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Fazer Login</CardTitle>
            <CardDescription className="text-gray-600">
              Entre com suas credenciais para acessar a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@eurofarma.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-yellow-500 hover:from-blue-700 hover:to-yellow-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                    <span className="text-white">Entrando...</span>
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {/* Ver Totem */}
            <Button
              type="button"
              variant="outline"
              className="w-full mt-3"
              onClick={() => navigate('/totem')}
              disabled={isLoading}
            >
              Ver Totem
            </Button>

          <div className="text-center mt-4 text-sm text-gray-600">
            Não tem conta?{' '}
            <button type="button" className="text-blue-600 hover:underline" onClick={() => navigate('/registro')}>
              Registre-se
            </button>
          </div>

            {/* Demo Users */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Usuários de Demonstração:
              </p>
              <div className="space-y-2">
                {demoUsers.map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                    onClick={async () => {
                      try {
                        setIsLoading(true)
                        setEmail(user.email)
                        const u = await SupabaseService.getUserByEmail(user.email)
                        if (u) {
                          const quickPwd = `Eurolytics@2025!${String(u.id).slice(0,8)}`
                          setPassword(quickPwd)
                          const result = await login(user.email, quickPwd)
                          if (result.success) {
                            toast({ title: 'Login rápido', description: `${user.role} autenticado`, variant: 'success' })
                            navigate('/loading')
                          } else {
                            toast({ title: 'Erro no login', description: result.error || 'Falha no login rápido', variant: 'destructive' })
                          }
                        } else {
                          toast({ title: 'Usuário não encontrado', description: user.email, variant: 'destructive' })
                        }
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                    disabled={isLoading}
                  >
                    <div className="font-medium">{user.email}</div>
                    <div className="text-gray-500">{user.role}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
