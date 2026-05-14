// engine/RoundController.ts — 轮次控制器
import type { GameState, Player, PlayerAction, ActionLogEntry, Pot } from './types'
import { GamePhase } from './types'
import { getAvailableActions } from './ActionValidator'
import { calculatePots } from './PotCalculator'

/**
 * 轮次控制器 — 管理下注轮内的行动循环
 * 
 * 职责：
 * - 确定当前行动玩家
 * - 判断轮次是否结束
 * - 处理大盲 Option
 * - Heads-up 特殊逻辑
 */

// 追踪玩家是否已行动（用于轮次结束判定）
interface PlayerActionTracker {
  playerId: string
  hasActed: boolean
}

/**
 * 获取下一个行动玩家
 */
export function getNextPlayer(state: GameState): number {
  const { players, currentPlayerIndex } = state
  let nextIndex = (currentPlayerIndex + 1) % players.length
  let attempts = 0

  while (attempts < players.length) {
    const player = players[nextIndex]
    if (player.isActive && !player.isFolded && !player.isAllIn) {
      return nextIndex
    }
    nextIndex = (nextIndex + 1) % players.length
    attempts++
  }

  return currentPlayerIndex // 如果没有合适的玩家，返回当前
}

/**
 * 处理玩家行动
 * 返回更新后的 GameState
 */
export function processPlayerAction(
  state: GameState,
  action: PlayerAction,
  trackers: Map<string, PlayerActionTracker>
): GameState {
  const { players, pots, phase } = state
  const playerIndex = players.findIndex(p => p.id === action.playerId)
  const player = players[playerIndex]

  if (!player) return state

  // 标记玩家已行动
  const tracker = trackers.get(action.playerId)
  if (tracker) {
    tracker.hasActed = true
  }

  // 创建行动日志
  const actionLog: ActionLogEntry = {
    playerId: action.playerId,
    playerName: player.name,
    action,
    phase,
    potAfter: pots.reduce((sum, p) => sum + p.amount, 0),
  }

  const updatedPlayers = [...players]
  let updatedPots = [...pots]
  const updatedPlayer = { ...player }

  switch (action.type) {
    case 'FOLD':
      updatedPlayer.isFolded = true
      break

    case 'CHECK':
      // 无需更新筹码
      break

    case 'CALL': {
      const callAmount = getCallAmount(state, player)
      const actualAmount = Math.min(callAmount, player.chips)
      updatedPlayer.chips -= actualAmount
      updatedPlayer.currentBet += actualAmount
      updatedPlayer.totalBetThisHand += actualAmount
      if (updatedPlayer.chips === 0) {
        updatedPlayer.isAllIn = true
      }
      break
    }

    case 'RAISE': {
      const raiseAmount = action.amount ?? player.currentBet + state.minRaise
      const increment = raiseAmount - player.currentBet
      updatedPlayer.chips -= increment
      updatedPlayer.currentBet = raiseAmount
      updatedPlayer.totalBetThisHand += increment
      if (updatedPlayer.chips === 0) {
        updatedPlayer.isAllIn = true
      }
      break
    }

    case 'ALL_IN': {
      const allInAmount = player.chips
      updatedPlayer.currentBet += allInAmount
      updatedPlayer.totalBetThisHand += allInAmount
      updatedPlayer.chips = 0
      updatedPlayer.isAllIn = true
      break
    }
  }

  updatedPlayers[playerIndex] = updatedPlayer

  // 重新计算底池
  updatedPots = calculatePotsFromPlayers(updatedPlayers)

  // 找下一个行动玩家
  const nextPlayerIndex = getNextPlayer({
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: playerIndex,
  })

  return {
    ...state,
    players: updatedPlayers,
    pots: updatedPots,
    currentPlayerIndex: nextPlayerIndex,
    lastAction: actionLog,
    actionHistory: [...state.actionHistory, actionLog],
  }
}

/**
 * 获取跟注金额
 */
function getCallAmount(state: GameState, player: Player): number {
  const maxBet = Math.max(...state.players.map(p => p.currentBet))
  return maxBet - player.currentBet
}

/**
 * 从玩家状态计算底池
 */
function calculatePotsFromPlayers(players: Player[]): Pot[] {
  return calculatePots(players).pots
}

/**
 * 判断当前下注轮是否结束
 */
export function isRoundComplete(
  state: GameState,
  trackers: Map<string, PlayerActionTracker>
): boolean {
  const { players, phase, dealerIndex } = state

  // 获取仍在本手牌中的玩家，以及仍可继续行动的玩家
  const contenders = players.filter(
    p => p.isActive && !p.isFolded
  )
  const actionablePlayers = contenders.filter(p => !p.isAllIn)

  // 如果只剩一名玩家或无人可行动，轮次结束
  if (contenders.length <= 1 || actionablePlayers.length === 0) {
    return true
  }

  // 未 All-in 的玩家必须匹配包含 All-in 下注在内的最高注
  const maxBet = Math.max(...contenders.map(p => p.currentBet))
  const allActionableBetsCovered = actionablePlayers.every(p => p.currentBet === maxBet)

  // 检查所有活跃玩家是否都已行动
  const allActed = actionablePlayers.every(p => {
    const tracker = trackers.get(p.id)
    return tracker?.hasActed ?? false
  })

  // Pre-flop 大盲 Option 特殊处理
  if (phase === GamePhase.PRE_FLOP) {
    const bbIndex = (dealerIndex + 2) % players.length
    const bbPlayer = players[bbIndex]
    
    // 如果是大盲位，且无人加注，需要给大盲 Option
    const bbTracker = trackers.get(bbPlayer.id)
    
    // 大盲未被加注且未行动，轮次未结束
    if (bbPlayer.currentBet === maxBet && !bbTracker?.hasActed) {
      return false
    }
  }

  return allActionableBetsCovered && allActed
}

/**
 * 初始化玩家行动追踪器
 */
export function initActionTrackers(players: Player[]): Map<string, PlayerActionTracker> {
  const trackers = new Map<string, PlayerActionTracker>()
  for (const player of players) {
    trackers.set(player.id, {
      playerId: player.id,
      hasActed: false,
    })
  }
  return trackers
}

/**
 * 重置行动追踪器（新下注轮开始时）
 */
export function resetActionTrackers(trackers: Map<string, PlayerActionTracker>): void {
  for (const tracker of trackers.values()) {
    tracker.hasActed = false
  }
}

/**
 * 轮换庄家按钮
 */
export function rotateDealer(state: GameState): GameState {
  const { players, dealerIndex } = state
  
  let newDealerIndex = (dealerIndex + 1) % players.length
  let attempts = 0
  
  // 跳过非活跃玩家
  while (!players[newDealerIndex].isActive && attempts < players.length) {
    newDealerIndex = (newDealerIndex + 1) % players.length
    attempts++
  }
  
  return {
    ...state,
    dealerIndex: newDealerIndex,
  }
}

/**
 * 获取当前可用行动
 */
export function getCurrentAvailableActions(state: GameState): ReturnType<typeof getAvailableActions> {
  const currentPlayer = state.players[state.currentPlayerIndex]
  if (!currentPlayer) {
    return []
  }
  
  return getAvailableActions(currentPlayer, state)
}

/**
 * 检查是否是 Pre-flop 大盲 Option
 */
export function isBigBlindOption(state: GameState): boolean {
  const { players, phase, dealerIndex } = state
  
  if (phase !== GamePhase.PRE_FLOP) {
    return false
  }
  
  const bbIndex = (dealerIndex + 2) % players.length
  const currentPlayer = players[state.currentPlayerIndex]
  const bbPlayer = players[bbIndex]
  
  // 当前玩家是大盲位
  if (currentPlayer.id !== bbPlayer.id) {
    return false
  }
  
  // 大盲未被加注（当前最高注 = 大盲注）
  const maxBet = Math.max(...players.map(p => p.currentBet))
  return bbPlayer.currentBet === maxBet
}