import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { 
  Trophy, 
  Users, 
  Lightbulb, 
  QrCode,
  Play,
  ArrowRight,
  CheckCircle,
  XCircle,
  RotateCcw,
  Home
} from 'lucide-react'
import { SupabaseService } from '../lib/supabaseService'
import type { User, Quiz } from '../types/index'
import { getInitials, formatPoints } from '../lib/utils'
import EurolyticsLogo from '../assets/eurolytics_logo.svg'

export default function Totem() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'ranking' | 'quiz' | 'quiz-active' | 'quiz-result'>('home')
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizScore, setQuizScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [_, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rankingUsers, allQuizzes] = await Promise.all([
          SupabaseService.getRanking(10),
          SupabaseService.getQuizzes()
        ])
        setUsers(rankingUsers)
        setQuizzes(allQuizzes)
      } catch (error) {
        console.error('Erro ao carregar dados do totem:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Auto-reset para tela inicial após inatividade
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentScreen !== 'home') {
        setCurrentScreen('home')
        resetQuiz()
      }
    }, 60000) // 1 minuto de inatividade

    return () => clearTimeout(timer)
  }, [currentScreen])

  // Timer do quiz
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentScreen === 'quiz-active' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleQuizComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [currentScreen, timeLeft])

  const resetQuiz = () => {
    setSelectedQuiz(null)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setQuizAnswers({})
    setQuizScore(0)
    setTimeLeft(0)
  }

  const startQuiz = (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId)
    if (!quiz) return

    setSelectedQuiz(quizId)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setQuizAnswers({})
    setQuizScore(0)
    setTimeLeft(quiz.time_limit)
    setCurrentScreen('quiz-active')
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleNextQuestion = () => {
    const quiz = quizzes.find(q => q.id === selectedQuiz)
    const questions = quiz?.quiz_questions ?? (quiz as any)?.questions ?? []
    if (!quiz || !questions.length || selectedAnswer === null) return

    const questionId = questions[currentQuestion].id
    const newAnswers = { ...quizAnswers, [questionId]: selectedAnswer }
    setQuizAnswers(newAnswers)
    setSelectedAnswer(null)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      handleQuizComplete(newAnswers)
    }
  }

  const handleQuizComplete = (finalAnswers?: Record<string, number>) => {
    const quiz = quizzes.find(q => q.id === selectedQuiz)
    const questions = quiz?.quiz_questions ?? (quiz as any)?.questions ?? []
    if (!quiz || !questions.length) return

    const answers = finalAnswers || quizAnswers
    let score = 0

    questions.forEach((question: any) => {
      const userAnswer = answers[question.id]
      if (userAnswer === question.correct_answer) {
        score += question.points
      }
    })

    setQuizScore(score)
    setCurrentScreen('quiz-result')
  }

  const topUsers = users
    .sort((a, b) => b.points - a.points)
    .slice(0, 10)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Tela inicial
  if (currentScreen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mx-auto w-24 h-24 rounded-2xl flex items-center justify-center mb-6 bg-white/20">
              <img src={EurolyticsLogo} alt="Eurolytics" className="w-16 h-16" />
            </div>
            <h1 className="text-6xl font-bold mb-4">Eurolytics</h1>
            <p className="text-2xl text-blue-100">Plataforma de Inovação Corporativa</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-8 text-center h-48 flex flex-col items-center justify-center">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 text-yellow-300" />
                <p className="text-4xl font-bold mb-2">150+</p>
                <p className="text-xl text-blue-100">Ideias Submetidas</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-8 text-center h-48 flex flex-col items-center justify-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-green-300" />
                <p className="text-4xl font-bold mb-2">{users.length}</p>
                <p className="text-xl text-blue-100">Colaboradores Ativos</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-8 text-center h-48 flex flex-col items-center justify-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-orange-300" />
                <p className="text-4xl font-bold mb-2">85%</p>
                <p className="text-xl text-blue-100">Taxa de Engajamento</p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Button
              onClick={() => setCurrentScreen('ranking')}
              className="h-32 bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white text-xl font-semibold"
            >
              <div className="flex flex-col items-center space-y-3">
                <Trophy className="h-10 w-10" />
                <span>Ver Ranking</span>
              </div>
            </Button>

            <Button
              onClick={() => setCurrentScreen('quiz')}
              className="h-32 bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white text-xl font-semibold"
            >
              <div className="flex flex-col items-center space-y-3">
                <Play className="h-10 w-10" />
                <span>Fazer Quiz</span>
              </div>
            </Button>

            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-8 text-center h-32 flex flex-col items-center justify-center">
                <QrCode className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Baixe o App</p>
                <p className="text-sm text-blue-100">Escaneie o QR Code</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Tela de ranking
  if (currentScreen === 'ranking') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-900">🏆 Ranking de Inovação</h1>
            <Button onClick={() => setCurrentScreen('home')} variant="outline" size="lg">
              <Home className="h-5 w-5 mr-2" />
              Voltar
            </Button>
          </div>

          <Card>
            <CardContent className="pt-8">
              <div className="space-y-6">
                {topUsers.map((user, index) => {
                  const position = index + 1
                  let bgColor = 'bg-gray-50'
                  let textColor = 'text-gray-900'
                  
                  if (position === 1) {
                    bgColor = 'bg-gradient-to-r from-yellow-100 to-yellow-50'
                    textColor = 'text-yellow-900'
                  } else if (position === 2) {
                    bgColor = 'bg-gradient-to-r from-gray-100 to-gray-50'
                    textColor = 'text-gray-900'
                  } else if (position === 3) {
                    bgColor = 'bg-gradient-to-r from-orange-100 to-orange-50'
                    textColor = 'text-orange-900'
                  }

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-6 p-6 rounded-lg ${bgColor}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                          position <= 3 ? 'bg-white shadow-lg' : 'bg-blue-600 text-white'
                        }`}>
                          {position <= 3 ? (
                            position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'
                          ) : (
                            getInitials(user.full_name)
                          )}
                        </div>
                        <div className="text-3xl font-bold text-gray-400">
                          #{position}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className={`text-2xl font-bold ${textColor}`}>
                          {user.full_name}
                        </h3>
                        <p className="text-lg text-gray-600">{user.department}</p>
                        <Badge variant="secondary" className="mt-2">
                          {user.role}
                        </Badge>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${textColor}`}>
                          {formatPoints(user.points)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Tela de seleção de quiz
  if (currentScreen === 'quiz') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-900">🎯 Quizzes Disponíveis</h1>
            <Button onClick={() => setCurrentScreen('home')} variant="outline" size="lg">
              <Home className="h-5 w-5 mr-2" />
              Voltar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {quizzes.map((quiz: any) => (
              <Card key={quiz.id} className="h-full">
                <CardHeader>
                  <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                  <p className="text-gray-600 text-lg">{quiz.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-lg">
                      <span>⏱️ {Math.floor(quiz.time_limit / 60)} minutos</span>
                      <span>🏆 {formatPoints(quiz.max_points)}</span>
                    </div>
                    <div className="text-lg text-gray-600">
                      📝 {(quiz.quiz_questions?.length ?? quiz.questions?.length ?? 0)} perguntas
                    </div>
                    <Button
                      onClick={() => startQuiz(quiz.id)}
                      className="w-full h-16 text-xl"
                      variant="eurolytics"
                    >
                      <Play className="h-6 w-6 mr-3" />
                      Começar Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Tela de quiz ativo
  if (currentScreen === 'quiz-active') {
    const quiz = quizzes.find(q => q.id === selectedQuiz)
    const questions = quiz?.quiz_questions ?? (quiz as any)?.questions ?? []
    if (!quiz || !questions.length) return null

    const currentQ = questions[currentQuestion]
    const progress = ((currentQuestion + 1) / questions.length) * 100

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-xl text-gray-600">
                Pergunta {currentQuestion + 1} de {questions.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-600 mb-2">
                ⏰ {formatTime(timeLeft)}
              </div>
              <Button onClick={() => setCurrentScreen('home')} variant="outline">
                Sair do Quiz
              </Button>
            </div>
          </div>

          {/* Progress */}
          <Progress value={progress} className="h-4 mb-8" />

          {/* Pergunta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{currentQ?.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {currentQ?.options?.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full p-8 text-left border-2 rounded-lg transition-all text-xl ${
                      selectedAnswer === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-6">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg font-bold ${
                        selectedAnswer === index
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center mt-8">
                <div className="text-lg text-gray-500">
                  🎯 {currentQ?.points} pontos
                </div>
                <Button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswer === null}
                  size="lg"
                  className="text-xl px-8"
                >
                  {currentQuestion === questions.length - 1 ? 'Finalizar' : 'Próxima'}
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Tela de resultado
  if (currentScreen === 'quiz-result') {
    const quiz = quizzes.find(q => q.id === selectedQuiz)
    if (!quiz) return null

    const percentage = (quizScore / quiz.max_points) * 100
    const isGoodScore = percentage >= 70

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-12 text-center">
              <div className="mb-8">
                {isGoodScore ? (
                  <div className="w-32 h-32 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                ) : (
                  <div className="w-32 h-32 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <XCircle className="h-16 w-16 text-red-600" />
                  </div>
                )}
                
                <h1 className="text-4xl font-bold mb-4">
                  {isGoodScore ? '🎉 Parabéns!' : '💪 Continue Tentando!'}
                </h1>
                <p className="text-2xl text-gray-600 mb-8">Quiz Concluído</p>
              </div>

              <div className="mb-8">
                <div className={`text-6xl font-bold mb-4 ${
                  isGoodScore ? 'text-green-600' : 'text-red-600'
                }`}>
                  {quizScore}/{quiz.max_points}
                </div>
                <p className="text-2xl text-gray-600">
                  {percentage.toFixed(0)}% de acertos
                </p>
              </div>

              <div className="flex justify-center space-x-6">
                <Button
                  onClick={() => setCurrentScreen('home')}
                  size="lg"
                  className="text-xl px-8"
                >
                  <Home className="h-6 w-6 mr-3" />
                  Tela Inicial
                </Button>
                <Button
                  onClick={() => startQuiz(selectedQuiz!)}
                  variant="outline"
                  size="lg"
                  className="text-xl px-8"
                >
                  <RotateCcw className="h-6 w-6 mr-3" />
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
