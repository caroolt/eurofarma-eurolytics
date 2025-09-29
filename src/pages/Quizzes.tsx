import { useState, useEffect, type JSXElementConstructor, type Key, type ReactElement, type ReactNode, type ReactPortal } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { 
  Play, 
  Trophy, 
  Clock, 
  CheckCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react'
import { SupabaseService } from '../lib/supabaseService'
import type { Quiz } from '../types/index'
import { useToast } from '../hooks/useToast'
import { formatPoints } from '../lib/utils'

interface QuizAttempt {
  quizId: string
  score: number
  maxScore: number
  completed: boolean
  answers: Record<string, number>
}

export default function Quizzes() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizResults, setQuizResults] = useState<QuizAttempt | null>(null)

  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [previousAttempts, setPreviousAttempts] = useState<QuizAttempt[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const qs = await SupabaseService.getQuizzes()
        setQuizzes(qs)
        if (qs[0]) setSelectedQuiz(qs[0].id)
      } catch (e) {
        console.error('Erro ao carregar quizzes', e)
      }
    }
    load()
  }, [])

  // Carregar tentativas anteriores reais do usuário
  useEffect(() => {
    const loadAttempts = async () => {
      if (!user) return
      try {
        const atts = await SupabaseService.getQuizAttemptsByUser(user.id)
        const mapped: QuizAttempt[] = (atts as any[]).map((a) => ({
          quizId: a.quiz_id,
          score: a.score || 0,
          maxScore: a.quizzes?.max_points || 0,
          completed: true,
          answers: {}
        }))
        setPreviousAttempts(mapped)
      } catch (e) {
        console.error('Erro ao carregar tentativas de quiz', e)
      }
    }
    loadAttempts()
  }, [user, quizzes.length])

  const currentQuizData = quizzes.find(q => q.id === selectedQuiz)

  // Timer do quiz
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (quizStarted && timeLeft > 0 && !quizCompleted) {
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
  }, [quizStarted, timeLeft, quizCompleted])

  const startQuiz = (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId)
    if (!quiz) return

    setSelectedQuiz(quizId)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setUserAnswers({})
    setTimeLeft(quiz.time_limit)
    setQuizStarted(true)
    setQuizCompleted(false)
    setQuizResults(null)
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleNextQuestion = () => {
    if (!currentQuizData || selectedAnswer === null) return
    const questions = (currentQuizData as any)?.quiz_questions ?? currentQuizData?.questions ?? []
    if (!questions.length) return

    const questionId = questions[currentQuestion]?.id
    if (questionId) {
      setUserAnswers(prev => ({ ...prev, [questionId]: selectedAnswer }))
    }
    setSelectedAnswer(null)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      handleQuizComplete()
    }
  }

  const handleQuizComplete = () => {
    if (!currentQuizData) return
    const questions = (currentQuizData as any)?.quiz_questions ?? currentQuizData?.questions ?? []
    if (!questions.length) return
    // Calcular pontuação
    let totalScore = 0
    questions.forEach((question: any) => {
      const questionId = question.id
      const userAnswer = userAnswers[questionId]
      if (userAnswer === question.correct_answer) {
        totalScore += question.points
      }
    })

    // Se ainda há uma resposta selecionada na última pergunta
    if (selectedAnswer !== null) {
      const lastQuestion = questions[currentQuestion]
      if (selectedAnswer === lastQuestion.correct_answer) {
        totalScore += lastQuestion.points
      }
    }

    const maxFromQuestions = questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0)
    const displayMax = currentQuizData.max_points || maxFromQuestions
    const results: QuizAttempt = {
      quizId: selectedQuiz!,
      score: totalScore,
      maxScore: displayMax,
      completed: true,
      answers: { ...userAnswers, [questions[currentQuestion]?.id as string]: selectedAnswer ?? 0 }
    }

    setQuizResults(results)
    setQuizCompleted(true)
    setQuizStarted(false)

    // Atualiza UI de forma otimista (marca como concluído e soma pontos locais)
    setPreviousAttempts((prev) => {
      const others = prev.filter(a => a.quizId !== selectedQuiz)
      const existing = prev.find(a => a.quizId === selectedQuiz)
      const bestScore = existing ? Math.max(existing.score, results.score) : results.score
      return [{ quizId: selectedQuiz!, score: bestScore, maxScore: currentQuizData.max_points, completed: true, answers: {} }, ...others]
    })

    // Mostrar toast com resultado
    const percentage = (totalScore / (displayMax || 1)) * 100
    toast({
      title: "Quiz concluído!",
      description: `Você fez ${totalScore} de ${displayMax} pontos (${percentage.toFixed(0)}%)`,
      variant: percentage >= 70 ? "success" : "default"
    })

    // Persistir tentativa e pontuação no Supabase
    ;(async () => {
      try {
        await SupabaseService.createQuizAttempt({
          user_id: user!.id,
          quiz_id: selectedQuiz!,
          score: totalScore,
          answers: results.answers || userAnswers
        } as any)

        // Atualizar pontos do usuário
        const newPoints = (user?.points || 0) + totalScore
        await SupabaseService.updateUserPoints(user!.id, newPoints)

        // Atualizar cache local do usuário (para refletir na UI em futuras leituras)
        const saved = localStorage.getItem('eurolytics-user')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            parsed.points = newPoints
            localStorage.setItem('eurolytics-user', JSON.stringify(parsed))
          } catch {}
        }

        // Recarrega tentativas do Supabase para refletir conclusão real
        try {
          const attsReload = await SupabaseService.getQuizAttemptsByUser(user!.id)
          const mappedReload: QuizAttempt[] = (attsReload as any[]).map((a) => ({
            quizId: a.quiz_id,
            score: a.score || 0,
            maxScore: a.quizzes?.max_points || 0,
            completed: true,
            answers: {}
          }))
          setPreviousAttempts(mappedReload)
        } catch {
          // fallback: atualiza localmente
          setPreviousAttempts((prev) => [
            { quizId: selectedQuiz!, score: totalScore, maxScore: currentQuizData.max_points, completed: true, answers: {} },
            ...prev
          ])
        }
      } catch (e) {
        console.error('Erro ao salvar tentativa/pontos do quiz', e)
      }
    })()
  }

  const resetQuiz = () => {
    setSelectedQuiz(null)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setUserAnswers({})
    setTimeLeft(0)
    setQuizStarted(false)
    setQuizCompleted(false)
    setQuizResults(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!user) return null

  // Tela de quiz ativo
  if (quizStarted && currentQuizData && !quizCompleted) {
    const questions = (currentQuizData as any)?.quiz_questions ?? currentQuizData?.questions ?? []
    if (!questions || questions.length === 0 || currentQuestion >= questions.length) {
      return <div className="text-center py-12">Quiz indisponível.</div>
    }
    const currentQ = questions[currentQuestion]
    const progress = ((currentQuestion + 1) / questions.length) * 100

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header do Quiz */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{currentQuizData.title}</h1>
            <p className="text-gray-600">
              Pergunta {currentQuestion + 1} de {questions.length}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-red-500" />
              <span className={timeLeft < 60 ? 'text-red-500' : 'text-gray-900'}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <Button variant="outline" onClick={resetQuiz}>
              Sair do Quiz
            </Button>
          </div>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-2" />

        {/* Pergunta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{currentQ?.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQ?.options?.map((option: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 text-left border rounded-lg transition-all ${
                    selectedAnswer === index
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswer === index && (
                        <CheckCircle className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span className="font-medium">{String.fromCharCode(65 + index)})</span>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                {currentQ.points} pontos
              </div>
              <Button
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null}
              >
                {currentQuestion === questions.length - 1 ? 'Finalizar' : 'Próxima'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela de resultados
  if (quizCompleted && quizResults && currentQuizData) {
    const questions = (currentQuizData as any)?.quiz_questions ?? currentQuizData?.questions ?? []
    const percentage = (quizResults.score / quizResults.maxScore) * 100

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Quiz Concluído!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div>
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(quizResults.score, quizResults.maxScore)}`}>
                {quizResults.score > quizResults.maxScore ? quizResults.maxScore : quizResults.score}/{quizResults.maxScore}
              </div>
              <p className="text-gray-600">
                {Number(percentage.toFixed(0)) > 100 ? 100 : Number(percentage.toFixed(0))}% de acertos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {Object.values(quizResults.answers).filter((answer, index) => 
                    answer === questions[index]?.correct_answer
                  ).length}
                </p>
                <p className="text-sm text-gray-600">Acertos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {questions.length - Object.values(quizResults.answers).filter((answer, index) => 
                    answer === questions[index]?.correct_answer
                  ).length}
                </p>
                <p className="text-sm text-gray-600">Erros</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  +{formatPoints(quizResults.score)}
                </p>
                <p className="text-sm text-gray-600">Pontos Ganhos</p>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button onClick={resetQuiz}>
                Ver Outros Quizzes
              </Button>
              <Button variant="outline" onClick={() => startQuiz(selectedQuiz!)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela principal de quizzes
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quizzes de Inovação</h1>
        <p className="text-gray-600">Teste seus conhecimentos e ganhe pontos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{previousAttempts.length}</p>
                <p className="text-sm text-gray-600">Quizzes Completados</p>
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
                  {previousAttempts.reduce((sum, attempt) => sum + attempt.score, 0)}
                </p>
                <p className="text-sm text-gray-600">Pontos Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">%</span>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {previousAttempts.length > 0 
                    ? Math.round(
                      (previousAttempts.reduce((sum, attempt) => 
                        sum + (attempt.score / attempt.maxScore), 0 
                      ) / previousAttempts.length) * 100
                    ) > 100 ? 100 : Math.round((previousAttempts.reduce((sum, attempt) => sum + (attempt.score / attempt.maxScore), 0) / previousAttempts.length) * 100) 
                    : 0}%
                </p>
                <p className="text-sm text-gray-600">Média de Acertos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quizzes Disponíveis */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quizzes Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz: any) => {
            const previousAttempt = previousAttempts.find(a => a.quizId === quiz.id)
            
            return (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <p className="text-gray-600 text-sm mt-1">{quiz.description}</p>
                    </div>
                    {previousAttempt && (
                      <Badge variant="success">Concluído</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{Math.floor(quiz.time_limit / 60)}min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Trophy className="h-4 w-4" />
                          <span>{formatPoints(quiz.max_points)}</span>
                        </div>
                      </div>
                      <span>{(quiz.quiz_questions?.length ?? quiz.questions?.length ?? 0)} perguntas</span>
                    </div>

                    {previousAttempt && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium">Melhor resultado:</p>
                        <p className={`text-lg font-bold ${getScoreColor(previousAttempt.score, previousAttempt.maxScore)}`}>
                          {previousAttempt.score > previousAttempt.maxScore ? previousAttempt.maxScore : previousAttempt.score} /{previousAttempt.maxScore} pontos
                        </p>
                      </div>
                    )}

                    <Button 
                      onClick={() => startQuiz(quiz.id)}
                      className="w-full"
                      variant={previousAttempt ? "outline" : "default"}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {previousAttempt ? 'Tentar Novamente' : 'Começar Quiz'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
