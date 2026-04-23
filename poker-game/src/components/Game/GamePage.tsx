// components/Game/GamePage.tsx — 游戏主页面
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PokerTable } from '@/components/Table/PokerTable'
import { ActionPanel } from '@/components/Actions/ActionPanel'
import { ActionLog } from '@/components/Log/ActionLog'
import { ResultModal } from '@/components/Common/ResultModal'
import { useGameState, useGameActions } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { useNPCScheduler } from '@/hooks/useNPCScheduler'
import type { GameSettings, GamePhase } from '@/engine/types'

export function GamePage() {
  const navigate = useNavigate()
  const gameState = useGameState()
  const { initGame, startRound, nextRound } = useGameActions()
  const { showResultModal, setShowResultModal, actionLogVisible } = useUiStore()
  const [isLoading, setIsLoading] = useState(true)
  
  // NPC 调度
  const { isNPCThinking } = useNPCScheduler()

  useEffect(() => {
    // 从 localStorage 读取游戏设置
    const settingsJson = localStorage.getItem('poker-game-settings')

    if (!settingsJson) {
      // 没有设置，返回大厅
      navigate('/lobby')
      return
    }

    try {
      const settings: GameSettings = JSON.parse(settingsJson)
      initGame(settings)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load game settings:', error)
      navigate('/lobby')
    }
  }, [initGame, navigate])

  // 结算后自动显示结果弹窗
  useEffect(() => {
    if (gameState?.phase === 'SETTLE' && gameState.winner && gameState.winner.length > 0) {
      setShowResultModal(true)
    }
  }, [gameState?.phase, gameState?.winner, setShowResultModal])

  const handleBackToLobby = () => {
    localStorage.removeItem('poker-game-settings')
    navigate('/lobby')
  }

  const handleNextRound = () => {
    nextRound()
  }

  if (isLoading || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 flex items-center justify-center">
        <div className="text-white text-xl">正在加载游戏...</div>
      </div>
    )
  }

  // 获取人类玩家 ID
  const humanPlayer = gameState.players.find((p) => !p.isNPC)

  const handleStartRound = () => {
    startRound()
  }

  // 获取当前阶段显示名称
  const getPhaseName = (phase: GamePhase) => {
    switch (phase) {
      case 'WAITING': return '等待开始'
      case 'PRE_FLOP': return '翻牌前'
      case 'FLOP': return '翻牌'
      case 'TURN': return '转牌'
      case 'RIVER': return '河牌'
      case 'SHOWDOWN': return '摊牌'
      case 'SETTLE': return '结算'
      default: return phase
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 flex flex-col">
      {/* 顶部导航 */}
      <div className="flex justify-between items-center p-4 bg-black/20">
        <div className="text-white">
          <span className="text-lg font-bold">德州扑克</span>
          <span className="text-green-300 ml-4">第 {gameState.round} 手</span>
          <span className="text-yellow-400 ml-4">阶段: {getPhaseName(gameState.phase)}</span>
        </div>
        <button
          onClick={handleBackToLobby}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          返回大厅
        </button>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex gap-4 p-4">
        {/* 左侧日志（如果显示） */}
        {actionLogVisible && (
          <div className="w-64 flex-shrink-0">
            <ActionLog />
          </div>
        )}

        {/* 牌桌 */}
        <div className="flex-1 flex items-center justify-center">
          <PokerTable gameState={gameState} currentPlayerId={humanPlayer?.id} />
        </div>
      </div>

      {/* 底部操作区 */}
      <div className="p-4 bg-black/20 space-y-4">
        {/* 开始游戏按钮 */}
        {gameState.phase === 'WAITING' && (
          <div className="flex justify-center">
            <button
              onClick={handleStartRound}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              开始新一手
            </button>
          </div>
        )}

        {/* 操作面板 */}
        <ActionPanel />

        {/* NPC 思考提示 */}
        {isNPCThinking && (
          <div className="bg-blue-900/50 rounded-lg p-3 text-center">
            <span className="text-blue-300">NPC 正在思考...</span>
          </div>
        )}
      </div>

      {/* 结果弹窗 */}
      <ResultModal onNextRound={handleNextRound} />
    </div>
  )
}