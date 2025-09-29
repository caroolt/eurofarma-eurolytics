import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { useToast } from '../hooks/useToast'
import EurolyticsLogo from '../assets/eurolytics_logo.svg'
import { SupabaseService } from '../lib/supabaseService'

export default function Register() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState('Inovação')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.toLowerCase().endsWith('@eurofarma.com')) {
      toast({ title: 'Email inválido', description: 'Use seu email @eurofarma.com', variant: 'destructive' })
      return
    }
    setIsLoading(true)
    try {
      await SupabaseService.registerUser({ email, password, full_name: fullName, department })
      toast({ title: 'Conta criada', description: 'Você já pode fazer login.', variant: 'success' })
      navigate('/login')
    } catch (e: any) {
      toast({ title: 'Erro ao registrar', description: e?.message || 'Tente novamente.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src={EurolyticsLogo} alt="Eurolytics" className="mx-auto mb-4 h-16 w-16" />
          <h2 className="text-3xl font-bold text-gray-900">Criar Conta</h2>
          <p className="mt-2 text-sm text-gray-600">Use seu email corporativo @eurofarma.com</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border border-white/30 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Registro</CardTitle>
            <CardDescription className="text-gray-600">Preencha seus dados</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome completo</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email (@eurofarma.com)</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Departamento</label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <Button type="submit" className="w-full from-blue-600 to-yellow-500 bg-gradient-to-r" disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Registrar'}
              </Button>
              <div className="text-center text-sm text-gray-600">
                Já tem conta?{' '}
                <button type="button" className="text-blue-600 hover:underline" onClick={() => navigate('/login')}>Entrar</button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


