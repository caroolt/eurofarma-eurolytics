# 🚀 Eurolytics - Plataforma de Inovação Corporativa

Uma plataforma moderna e gamificada para engajar colaboradores da Eurofarma em programas de inovação corporativa.

## ✨ Funcionalidades

### 🔐 Sistema de Autenticação
- Login com email/senha
- Perfis diferenciados: Colaborador, Gestor, Executivo
- Sistema de permissões baseado em roles

### 👤 Dashboard do Colaborador
- **Home personalizada** com pontuação, ranking e badges
- **Sistema de gamificação** completo com pontos e conquistas
- **Submissão de ideias** com formulário estruturado
- **Quizzes interativos** sobre inovação
- **Ranking global** e por departamento

### 📊 Dashboard Executivo/Gestor
- **KPIs em tempo real** com métricas de engajamento
- **Gráficos interativos** usando Recharts
- **Gestão de ideias** com aprovação/rejeição
- **Analytics detalhados** por departamento e período
- **Filtros dinâmicos** e relatórios

### 🎯 Sistema de Quizzes
- Quizzes interativos com timer
- Feedback imediato e pontuação
- Sistema de conquistas e badges
- Interface otimizada para mobile

### 🏪 Interface para Totens
- Interface simplificada e acessível
- Alto contraste para visibilidade
- Quizzes rápidos e ranking
- Auto-reset por inatividade

## 🛠 Stack Tecnológico

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Roteamento**: React Router DOM
- **Gráficos**: Recharts
- **Estado**: React Context + Hooks
- **Build**: Vite
- **Linting**: ESLint + TypeScript ESLint

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- pnpm (recomendado) ou npm

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd eurolytics
```

2. **Instale as dependências**
```bash
pnpm install
# ou
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
```

4. **Execute o projeto**
```bash
pnpm dev
# ou
npm run dev
```

5. **Acesse a aplicação**
- Aplicação principal: http://localhost:5173
- Interface de totem: http://localhost:5173/totem

## 👥 Usuários de Demonstração

### Colaborador
- **Email**: ana.silva@eurofarma.com
- **Senha**: 123456
- **Perfil**: Colaborador da Produção

### Gestor
- **Email**: carlos.mendes@eurofarma.com
- **Senha**: 123456
- **Perfil**: Gestor de Inovação

### Executivo
- **Email**: maria.santos@eurofarma.com
- **Senha**: 123456
- **Perfil**: Executivo da Diretoria

## 📱 Funcionalidades por Perfil

### 🔵 Colaborador
- ✅ Dashboard pessoal com gamificação
- ✅ Submissão e acompanhamento de ideias
- ✅ Participação em quizzes
- ✅ Visualização de ranking
- ✅ Sistema de badges e conquistas

### 🟢 Gestor
- ✅ Todas as funcionalidades do colaborador
- ✅ Dashboard executivo com KPIs
- ✅ Gestão de ideias da equipe
- ✅ Analytics e relatórios

### 🟡 Executivo
- ✅ Todas as funcionalidades anteriores
- ✅ Visão completa de analytics
- ✅ Gestão de usuários
- ✅ Relatórios executivos

## 🎨 Design System

### Cores Principais
- **Azul Corporativo**: #1e40af (primary)
- **Verde Sucesso**: #10b981 (success)
- **Gradientes**: Azul para interfaces principais

### Tipografia
- **Fonte**: Inter (Google Fonts)
- **Pesos**: 300, 400, 500, 600, 700

### Componentes
- Baseados no Shadcn/ui
- Totalmente responsivos
- Acessibilidade WCAG AA
- Modo alto contraste disponível

## 📊 Dados Mockados

A aplicação inclui dados completos de demonstração:

- **50+ usuários** de diferentes departamentos
- **100+ ideias** em várias categorias
- **10+ quizzes** sobre inovação
- **Sistema de badges** funcional
- **Analytics realistas** com gráficos

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev

# Build de produção
pnpm build

# Preview do build
pnpm preview

# Linting
pnpm lint
```

## 📱 Responsividade

- **Mobile First**: Design otimizado para dispositivos móveis
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Interface adaptável**: Sidebar colapsível, navegação otimizada

## ♿ Acessibilidade

- **WCAG AA**: Contraste adequado em todos os componentes
- **Navegação por teclado**: Totalmente funcional
- **Screen readers**: Suporte completo
- **Alto contraste**: Modo disponível para totens
- **Textos alternativos**: Em todas as imagens e ícones

## 🏗 Arquitetura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (Shadcn/ui)
│   ├── Layout.tsx      # Layout principal
│   └── ProtectedRoute.tsx
├── contexts/           # Contextos React
│   └── AuthContext.tsx
├── data/              # Dados mockados
│   └── mockData.ts
├── hooks/             # Custom hooks
│   └── useToast.ts
├── lib/               # Utilitários
│   ├── supabase.ts    # Cliente Supabase
│   └── utils.ts       # Funções utilitárias
├── pages/             # Páginas principais
│   ├── Dashboard.tsx
│   ├── Ideas.tsx
│   ├── Quizzes.tsx
│   ├── Ranking.tsx
│   ├── Management.tsx
│   ├── Login.tsx
│   └── Totem.tsx
└── types/             # Tipos TypeScript
```

## 🎯 Próximos Passos

Para usar em produção, considere:

1. **Integração com Supabase real**
2. **Sistema de notificações push**
3. **Upload de arquivos para ideias**
4. **Sistema de comentários**
5. **Relatórios exportáveis**
6. **Integração com Active Directory**
7. **App mobile nativo**

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário da Eurofarma.

---

**Desenvolvido com ❤️ para a Eurofarma**