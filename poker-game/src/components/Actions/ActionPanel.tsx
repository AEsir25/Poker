// components/Actions/ActionPanel.tsx — 操作按钮面板
import { useState } from 'react'
import type { ActionType } from '@/engine/types'
import { useGameState, useGameActions } from '@/store/gameStore'
import { getAvailableActions } from '@/engine/ActionValidator'
import { RaiseSlider } from './RaiseSlider'

export function ActionPanel() {
  const gameState = useGameState()
  const { submitAction } = useGameActions()
  const [showRaiseSlider, setShowRaiseSlider] = useState(false)
  const [raiseAmount, setRaiseAmount] = useState(0)

  if (!gameState || gameState.phase === 'WAITING' || gameState.phase === 'SETTLE') {
    return null
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  
  // 只允许人类玩家操作
  if (!currentPlayer || currentPlayer.isNPC) {
    return (
      <div className="bg-black/50 rounded-lg p-4 text-center">
        <span className="text-gray-400">等待 {currentPlayer?.name || 'NPC'} 行动...</span>
      </div>
    )
  }

  const availableActions = getAvailableActions(gameState, currentPlayer.id)

  const handleAction = (type: ActionType, amount?: number) => {
    submitAction({
      type,
      amount,
      playerId: currentPlayer.id,
      timestamp: Date.now(),
    })
    setShowRaiseSlider(false)
  }

  const handleRaise = () => {
    setShowRaiseSlider(true)
    setRaiseAmount(currentPlayer.currentBet + gameState.minRaise)
  }

  const confirmRaise = () => {
    handleAction('RAISE', raiseAmount)
  }

  const canFold = availableActions.includes('FOLD')
  const canCheck = availableActions.includes('CHECK')
  const canCall = availableActions.includes('CALL')
  const canRaise = availableActions.includes('RAISE')
  const canAllIn = availableActions.includes('ALL_IN')

  // 计算跟注金额
  const callAmount = Math.min(
    Math.max(...gameState.players.map(p => p.currentBet)) - currentPlayer.currentBet,
    currentPlayer.chips
  )

  return (
    <div className="bg-black/50 rounded-lg p-4">
      {showRaiseSlider ? (
        <div className="space-y-4">
          <RaiseSlider
            minRaise={gameState.minRaise}
            maxChips={currentPlayer.chips}
            currentBet={currentPlayer.currentBet}
            value={raiseAmount}
            onChange={setRaiseAmount}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowRaiseSlider(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={confirmRaise}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              加注到 {raiseAmount}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {canFold && (
            <button
              onClick={() => handleAction('FOLD')}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              弃牌
            </button>
          )}
          
          {canCheck && (
            <button
              onClick={() => handleAction('CHECK')}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              过牌
            </button>
          )}
          
          {canCall && (
            <button
              onClick={() => handleAction('CALL')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              跟注 {callAmount}
            </button>
          )}
          
          {canRaise && (
            <button
              onClick={handleRaise}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              加注
            </button>
          )}
          
          {canAllIn && (
            <button
              onClick={() => handleAction('ALL_IN')}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              All In
            </button>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {/* {error && (
        <div className="mt-2 text-red-400 text-sm text-center">{error}</div>
      )} */}
    </div>
  )
}