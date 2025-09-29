import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import EurolyticsLogo from '../assets/eurolytics_logo.svg'

export default function Loading() {
  const navigate = useNavigate()

  useEffect(() => {
    const id = setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
    return () => clearTimeout(id)
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="text-center">
        <div className="relative inline-block">
          {/* Glow giratório */}
          <div className="absolute -inset-6 rounded-3xl blur-2xl bg-gradient-to-br from-blue-400/30 to-blue-600/20" style={{ animation: 'spin 3s linear infinite' }} />

          {/* Contêiner com animação de revelação do logo */}
          <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-white shadow-xl">
            <img
              src={EurolyticsLogo}
              alt="Eurolytics"
              className="absolute inset-0 h-full w-full object-contain p-3"
              style={{ animation: 'logo-reveal 1200ms ease-out forwards' }}
            />

            {/* Traçado sendo desenhado ao redor (efeito de construção) */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" fill="none">
              <rect x="6" y="6" width="88" height="88" rx="18" ry="18" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="320" strokeDashoffset="320" style={{ animation: 'draw 900ms 150ms ease-out forwards' }} />
            </svg>
          </div>
        </div>
        <p className="mt-6 text-gray-700 font-medium">Carregando seu dashboard...</p>
      </div>

      {/* Keyframes locais para a animação de construção */}
      <style>
        {`
        @keyframes logo-reveal {
          0% { clip-path: inset(0 100% 0 0); opacity: 0.6; transform: scale(0.96); }
          60% { opacity: 1; }
          100% { clip-path: inset(0 0 0 0); opacity: 1; transform: scale(1); }
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        `}
      </style>
    </div>
  )
}


