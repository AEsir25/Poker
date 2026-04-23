// router/index.tsx — 路由配置
import { createBrowserRouter } from 'react-router-dom'
import { LobbyPage } from '@/components/Lobby/LobbyPage'
import { GamePage } from '@/components/Game/GamePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LobbyPage />,
  },
  {
    path: '/lobby',
    element: <LobbyPage />,
  },
  {
    path: '/game/:id',
    element: <GamePage />,
  },
  {
    path: '/review',
    element: (
      <div className="min-h-screen bg-green-900 flex items-center justify-center">
        <div className="text-white p-8">复盘功能（V1.5+ 实现）</div>
      </div>
    ),
  },
  {
    path: '/review/:gameId',
    element: (
      <div className="min-h-screen bg-green-900 flex items-center justify-center">
        <div className="text-white p-8">单局复盘（V1.5+ 实现）</div>
      </div>
    ),
  },
])