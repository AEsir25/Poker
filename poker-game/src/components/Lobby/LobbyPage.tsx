// components/Lobby/LobbyPage.tsx — 大厅页
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameSettings } from './GameSettings'
import type { GameSettings as GameSettingsConfig } from '@/engine/types'

export function LobbyPage() {
  const navigate = useNavigate()
  const [isStarting, setIsStarting] = useState(false)

  const handleStartGame = async (settings: GameSettingsConfig) => {
    setIsStarting(true)
    try {
      // 将设置存入 localStorage，供游戏页面读取
      localStorage.setItem('poker-game-settings', JSON.stringify(settings))
      // 跳转到游戏页面
      navigate(`/game/1`)
    } catch (error) {
      console.error('Failed to start game:', error)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 flex items-center justify-center p-4">
      <div className="bg-green-800/50 backdrop-blur rounded-2xl shadow-2xl p-8 w-full max-w-md border border-green-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">德州扑克</h1>
          <p className="text-green-300">Texas Hold'em Poker</p>
        </div>

        <GameSettings onSubmit={handleStartGame} isLoading={isStarting} />

        <div className="mt-6 text-center text-green-400 text-sm">
          <p>单人对抗 NPC 离线游戏</p>
        </div>
      </div>
    </div>
  )
}