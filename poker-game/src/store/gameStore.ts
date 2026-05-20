// store/gameStore.ts — 游戏核心状态
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { v4 as uuidv4 } from 'uuid'
import type { GameState, GameSettings, Player, PlayerAction, Pot } from '@/engine/types'
import { GamePhase } from '@/engine/types'
import {
  startNewRound,
  advancePhase,
  settleRound,
  hasOnlyOneActivePlayer,
  isAllPlayersAllInOrFolded,
} from '@/engine/GameStateMachine'
import {
  processPlayerAction,
  isRoundComplete,
  initActionTrackers,
  resetActionTrackers,
  rotateDealer,
} from '@/engine/RoundController'
import { validateAction } from '@/engine/ActionValidator'

interface GameStore {
  // 状态
  gameState: GameState | null
  settings: GameSettings | null
  isLoading: boolean
  error: string | null

  // 内部状态（不序列化）
  actionTrackers: Map<string, { playerId: string; hasActed: boolean }>

  // Actions
  initGame: (settings: GameSettings) => void
  startRound: () => void
  submitAction: (action: PlayerAction) => void
  advanceToNextPhase: () => void
  settle: () => void
  resetGame: () => void
  nextRound: () => void
}

/**
 * 创建初始玩家列表
 */
function createPlayers(settings: GameSettings): Player[] {
  const players: Player[] = []
  const { playerCount, buyIn, playerName } = settings

  for (let i = 0; i < playerCount; i++) {
    const isHuman = i === 0
    players.push({
      id: uuidv4(),
      name: isHuman ? playerName : `NPC-${i}`,
      chips: buyIn,
      holeCards: [],
      isNPC: !isHuman,
      isActive: true,
      isFolded: false,
      isAllIn: false,
      currentBet: 0,
      totalBetThisHand: 0,
      seatIndex: i,
      skillId: isHuman ? undefined : 'balanced',
    })
  }

  return players
}

/**
 * 创建初始游戏状态
 */
function createInitialGameState(settings: GameSettings): GameState {
  const players = createPlayers(settings)

  return {
    id: uuidv4(),
    phase: GamePhase.WAITING,
    players,
    communityCards: [],
    deck: [],
    pots: [],
    dealerIndex: 0,
    currentPlayerIndex: 0,
    smallBlind: settings.smallBlind,
    bigBlind: settings.bigBlind,
    minRaise: settings.bigBlind,
    lastRaiseAmount: settings.bigBlind,
    round: 0,
    actionHistory: [],
    lastAction: undefined,
    winner: undefined,
  }
}

function cloneActionTrackers(
  trackers: Map<string, { playerId: string; hasActed: boolean }>
): Map<string, { playerId: string; hasActed: boolean }> {
  return new Map(
    Array.from(trackers.entries()).map(([playerId, tracker]) => [
      playerId,
      { ...tracker },
    ])
  )
}

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    // 初始状态
    gameState: null,
    settings: null,
    isLoading: false,
    error: null,
    actionTrackers: new Map(),

    // 初始化游戏
    initGame: (settings) => {
      set((state) => {
        state.settings = settings
        state.gameState = createInitialGameState(settings)
        state.isLoading = false
        state.error = null
      })
    },

    // 开始新一手牌
    startRound: () => {
      const { gameState } = get()
      if (!gameState) return

      const newState = startNewRound(gameState)
      const newTrackers = initActionTrackers(newState.players)

      set((state) => {
        state.gameState = newState
        state.actionTrackers = newTrackers
      })
    },

    // 提交玩家行动
    submitAction: (action) => {
      const { gameState, actionTrackers } = get()
      if (!gameState) return

      // 验证行动
      const currentPlayer = gameState.players[gameState.currentPlayerIndex]
      if (!currentPlayer || currentPlayer.id !== action.playerId) {
        set((state) => {
          state.error = '不是该玩家的回合'
        })
        return
      }

      const validation = validateAction(action, currentPlayer, gameState)
      if (!validation.isValid) {
        set((state) => {
          state.error = validation.errorMessage || '行动无效'
        })
        return
      }

      // 处理行动
      const nextActionTrackers = cloneActionTrackers(actionTrackers)
      const newState = processPlayerAction(gameState, action, nextActionTrackers)

      set((state) => {
        state.gameState = newState
        state.actionTrackers = nextActionTrackers
        state.error = null
      })

      // 检查是否只剩一人
      if (hasOnlyOneActivePlayer(newState)) {
        // 直接结算
        get().settle()
        return
      }

      // 检查轮次是否结束
      if (isRoundComplete(newState, nextActionTrackers)) {
        // 检查是否所有人都 All-in 或弃牌
        if (isAllPlayersAllInOrFolded(newState)) {
          // 直接进入摊牌
          get().advanceToNextPhase()
          get().advanceToNextPhase()
          get().advanceToNextPhase()
          get().advanceToNextPhase()
          get().settle()
          return
        }

        // 推进到下一阶段
        get().advanceToNextPhase()
      }
    },

    // 推进到下一阶段
    advanceToNextPhase: () => {
      const { gameState, actionTrackers } = get()
      if (!gameState) return

      const newState = advancePhase(gameState)
      const nextActionTrackers = cloneActionTrackers(actionTrackers)
      resetActionTrackers(nextActionTrackers)

      set((state) => {
        state.gameState = newState
        state.actionTrackers = nextActionTrackers
      })
    },

    // 结算
    settle: () => {
      const { gameState } = get()
      if (!gameState) return

      const newState = settleRound(gameState)

      set((state) => {
        state.gameState = newState
      })
    },

    // 重置游戏
    resetGame: () => {
      set((state) => {
        state.gameState = null
        state.settings = null
        state.isLoading = false
        state.error = null
        state.actionTrackers = new Map()
      })
    },

    // 开始下一手牌
    nextRound: () => {
      const { gameState } = get()
      if (!gameState) return

      // 轮换庄家
      const rotatedState = rotateDealer(gameState)

      // 重置玩家状态
      const resetPlayers = rotatedState.players.map(p => ({
        ...p,
        holeCards: [],
        currentBet: 0,
        totalBetThisHand: 0,
        isFolded: false,
        isAllIn: false,
        // 如果筹码为0，标记为非活跃
        isActive: p.chips > 0 ? p.isActive : false,
      }))

      set((state) => {
        state.gameState = {
          ...rotatedState,
          players: resetPlayers,
          phase: GamePhase.WAITING,
          communityCards: [],
          deck: [],
          pots: [],
          actionHistory: [],
          lastAction: undefined,
          winner: undefined,
        }
      })

      // 开始新一手
      get().startRound()
    },
  }))
)

// 导出便捷 hooks
export const useGameState = () => useGameStore((state) => state.gameState)
export const useGameSettings = () => useGameStore((state) => state.settings)
export const useGameActions = () =>
  useGameStore((state) => ({
    initGame: state.initGame,
    startRound: state.startRound,
    submitAction: state.submitAction,
    advanceToNextPhase: state.advanceToNextPhase,
    settle: state.settle,
    resetGame: state.resetGame,
    nextRound: state.nextRound,
  }))