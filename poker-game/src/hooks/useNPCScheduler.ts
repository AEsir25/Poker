// hooks/useNPCScheduler.ts — NPC 行动调度 hook
import { useEffect } from 'react'
import { useGameState, useGameActions } from '@/store/gameStore'
import { npcActionScheduler } from '@/ai/NPCActionScheduler'

/**
 * Hook 监听当前玩家变化，自动调度 NPC 行动
 */
export function useNPCScheduler() {
  const gameState = useGameState()
  const { submitAction } = useGameActions()

  useEffect(() => {
    if (!gameState) return

    const currentPlayer = gameState.players[gameState.currentPlayerIndex]

    // 如果当前玩家是 NPC，调度其行动
    if (currentPlayer?.isNPC && !currentPlayer.isFolded && !currentPlayer.isAllIn) {
      npcActionScheduler.scheduleAction(
        currentPlayer,
        gameState,
        (action) => {
          submitAction(action)
        }
      )
    }

    // 清理：组件卸载或状态变化时取消调度
    return () => {
      npcActionScheduler.cancel()
    }
  }, [gameState, submitAction])

  return {
    isNPCThinking: npcActionScheduler.processing,
  }
}