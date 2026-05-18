import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '@/store/gameStore'

describe('gameStore submitAction', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('应使用当前玩家对象验证行动并接受合法跟注', () => {
    useGameStore.getState().initGame({
      playerCount: 3,
      buyIn: 1000,
      smallBlind: 10,
      bigBlind: 20,
      playerName: 'Human',
    })
    useGameStore.getState().startRound()

    const beforeAction = useGameStore.getState().gameState
    expect(beforeAction).not.toBeNull()
    const currentPlayer = beforeAction!.players[beforeAction!.currentPlayerIndex]
    expect(currentPlayer.isNPC).toBe(false)

    useGameStore.getState().submitAction({
      type: 'CALL',
      playerId: currentPlayer.id,
      timestamp: Date.now(),
    })

    const afterAction = useGameStore.getState().gameState
    const human = afterAction!.players.find(player => player.id === currentPlayer.id)
    expect(useGameStore.getState().error).toBeNull()
    expect(human?.chips).toBe(980)
    expect(human?.currentBet).toBe(20)
  })
})
