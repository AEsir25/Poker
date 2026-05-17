// store/gameStore.test.ts — 游戏状态写入链回归测试
import { beforeEach, describe, expect, it } from 'vitest'
import type { GameSettings } from '@/engine/types'
import { useGameStore } from '@/store/gameStore'

const settings: GameSettings = {
  playerCount: 6,
  bigBlind: 20,
  smallBlind: 10,
  buyIn: 1000,
  playerName: 'Hero',
}

describe('gameStore submitAction', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('应使用校验器结果处理当前玩家的合法行动', () => {
    const store = useGameStore.getState()
    store.initGame(settings)
    store.startRound()

    const startedState = useGameStore.getState().gameState
    expect(startedState).not.toBeNull()

    const currentPlayer = startedState!.players[startedState!.currentPlayerIndex]
    useGameStore.getState().submitAction({
      type: 'FOLD',
      playerId: currentPlayer.id,
      timestamp: Date.now(),
    })

    const updatedStore = useGameStore.getState()
    const updatedPlayer = updatedStore.gameState!.players.find(
      (player) => player.id === currentPlayer.id
    )

    expect(updatedStore.error).toBeNull()
    expect(updatedPlayer?.isFolded).toBe(true)
    expect(updatedStore.gameState!.actionHistory).toHaveLength(1)
  })
})
