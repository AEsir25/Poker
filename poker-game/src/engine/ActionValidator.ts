// engine/ActionValidator.ts — 行动合法性验证
import type { GameState, Player, PlayerAction } from './types'
import { GamePhase } from './types'

/**
 * 行动验证结果
 */
export interface ActionValidationResult {
  isValid: boolean
  errorMessage?: string
}

/**
 * 获取当前需要匹配的最低下注额
 */
export function getCurrentBetToCall(gameState: GameState): number {
  const activePlayers = gameState.players.filter(
    (p) => p.isActive && !p.isFolded
  )

  if (activePlayers.length === 0) return 0

  return Math.max(...activePlayers.map((p) => p.currentBet))
}

/**
 * 检查是否所有活跃玩家都已下注到同一金额
 */
export function areBetsEqual(gameState: GameState): boolean {
  const actionablePlayers = gameState.players.filter(
    (p) => p.isActive && !p.isFolded && !p.isAllIn
  )

  if (actionablePlayers.length <= 1) return true

  const currentBetToCall = getCurrentBetToCall(gameState)

  return actionablePlayers.every((player) => player.currentBet === currentBetToCall)
}

/**
 * 检查大盲位是否还有 Option（可以过牌）
 * 条件：Pre-flop 阶段，大盲位尚未行动（currentBet < bigBlind），且无人加注
 */
export function hasBigBlindOption(gameState: GameState): boolean {
  if (gameState.phase !== GamePhase.PRE_FLOP) return false

  // 找到大盲位玩家
  const bigBlindIndex = (gameState.dealerIndex + 2) % gameState.players.length
  const bigBlindPlayer = gameState.players[bigBlindIndex]

  if (!bigBlindPlayer || !bigBlindPlayer.isActive || bigBlindPlayer.isFolded) {
    return false
  }

  // 大盲位尚未行动的标准：大盲位当前下注额小于大盲金额
  // （因为初始时大盲会被扣盲注，这里检查的是"是否还需要额外行动"）
  // 如果当前下注额等于大盲，说明已经下了盲注但还没有过牌/加注的机会
  const hasActed = bigBlindPlayer.currentBet >= gameState.bigBlind

  // 找到最高下注额
  const maxBet = getCurrentBetToCall(gameState)

  // 大盲位需要额外行动的情况：最高下注 > 大盲位当前下注
  // 如果最高下注等于大盲位当前下注，说明还没有人加注，大盲有 Option
  if (hasActed && maxBet === bigBlindPlayer.currentBet) {
    // 确认其他人都没有加注
    return areBetsEqual(gameState)
  }

  return false
}

/**
 * 验证 Fold 行动
 * Fold 任何时候都允许
 */
export function validateFold(
  action: PlayerAction,
  player: Player,
  _gameState: GameState
): ActionValidationResult {
  void _gameState

  if (!player.isActive) {
    return {
      isValid: false,
      errorMessage: '非活跃玩家不能行动',
    }
  }

  if (player.isFolded) {
    return {
      isValid: false,
      errorMessage: '玩家已经弃牌',
    }
  }

  if (player.isAllIn) {
    return {
      isValid: false,
      errorMessage: 'All-in 玩家不能弃牌',
    }
  }

  return { isValid: true }
}

/**
 * 验证 Check 行动
 * 条件：当前街无未匹配注；或 Pre-flop 大盲位且无人加注（Option）
 */
export function validateCheck(
  action: PlayerAction,
  player: Player,
  gameState: GameState
): ActionValidationResult {
  if (!player.isActive || player.isFolded || player.isAllIn) {
    return {
      isValid: false,
      errorMessage: '玩家不能过牌',
    }
  }

  const maxBet = getCurrentBetToCall(gameState)

  // 检查是否有未匹配的注
  if (player.currentBet < maxBet) {
    // 检查是否是大盲 Option
    if (!hasBigBlindOption(gameState)) {
      return {
        isValid: false,
        errorMessage: '有未匹配的下注，不能过牌',
      }
    }
  }

  return { isValid: true }
}

/**
 * 验证 Call 行动
 * 条件：存在未匹配注；筹码不足时自动转为 All-in
 */
export function validateCall(
  action: PlayerAction,
  player: Player,
  gameState: GameState
): ActionValidationResult {
  if (!player.isActive || player.isFolded || player.isAllIn) {
    return {
      isValid: false,
      errorMessage: '玩家不能跟注',
    }
  }

  const maxBet = getCurrentBetToCall(gameState)

  // 如果当前下注已经等于或超过最高下注，不需要跟注
  if (player.currentBet >= maxBet) {
    return {
      isValid: false,
      errorMessage: '不需要跟注',
    }
  }

  return { isValid: true }
}

/**
 * 验证 Raise 行动
 * 条件：加注后总额 ≥ 当前最高注 + minRaise；筹码足够
 */
export function validateRaise(
  action: PlayerAction,
  player: Player,
  gameState: GameState,
  options?: { maxRaisesPerRound?: number }
): ActionValidationResult {
  if (!player.isActive || player.isFolded || player.isAllIn) {
    return {
      isValid: false,
      errorMessage: '玩家不能加注',
    }
  }

  const maxBet = getCurrentBetToCall(gameState)
  const minRaise = gameState.minRaise

  if (action.amount === undefined) {
    return {
      isValid: false,
      errorMessage: '加注行动必须指定金额',
    }
  }

  const totalBetAfterRaise = action.amount
  const additionalChipsRequired = totalBetAfterRaise - player.currentBet

  if (additionalChipsRequired <= 0) {
    return {
      isValid: false,
      errorMessage: '加注金额必须高于当前下注',
    }
  }

  // 加注后总额必须 ≥ 当前最高注 + 最小加注增量
  if (totalBetAfterRaise < maxBet + minRaise) {
    return {
      isValid: false,
      errorMessage: `加注金额不足。最低需要 ${maxBet + minRaise}，当前总额 ${totalBetAfterRaise}`,
    }
  }

  // 检查筹码是否足够
  if (player.chips < additionalChipsRequired) {
    return {
      isValid: false,
      errorMessage: '筹码不足',
    }
  }

  // 检查是否超过加注次数限制（Cap 规则，可选）
  if (options?.maxRaisesPerRound !== undefined) {
    const raiseCount = gameState.actionHistory.filter(
      (a) => a.action.type === 'RAISE' || a.action.type === 'ALL_IN'
    ).length

    if (raiseCount >= options.maxRaisesPerRound) {
      return {
        isValid: false,
        errorMessage: `本轮已达到加注上限 (${options.maxRaisesPerRound})`,
      }
    }
  }

  return { isValid: true }
}

/**
 * 验证 All-in 行动
 * 条件：任何时候都可以全押
 */
export function validateAllIn(
  action: PlayerAction,
  player: Player,
  _gameState: GameState
): ActionValidationResult {
  void _gameState

  if (!player.isActive || player.isFolded) {
    return {
      isValid: false,
      errorMessage: '玩家不能全押',
    }
  }

  if (player.chips <= 0) {
    return {
      isValid: false,
      errorMessage: '没有可下的筹码',
    }
  }

  return { isValid: true }
}

/**
 * 统一的行动验证入口
 */
export function validateAction(
  action: PlayerAction,
  player: Player,
  gameState: GameState,
  options?: { maxRaisesPerRound?: number }
): ActionValidationResult {
  switch (action.type) {
    case 'FOLD':
      return validateFold(action, player, gameState)
    case 'CHECK':
      return validateCheck(action, player, gameState)
    case 'CALL':
      return validateCall(action, player, gameState)
    case 'RAISE':
      return validateRaise(action, player, gameState, options)
    case 'ALL_IN':
      return validateAllIn(action, player, gameState)
    default:
      return {
        isValid: false,
        errorMessage: `未知的行动类型: ${(action as PlayerAction).type}`,
      }
  }
}

/**
 * 获取当前玩家可用的行动列表
 */
export function getAvailableActions(
  player: Player,
  gameState: GameState,
  options?: { maxRaisesPerRound?: number }
): PlayerAction['type'][] {
  const availableActions: PlayerAction['type'][] = []

  // Fold 总是可用
  if (validateFold({ type: 'FOLD', playerId: player.id, timestamp: Date.now() }, player, gameState).isValid) {
    availableActions.push('FOLD')
  }

  // Check
  if (validateCheck({ type: 'CHECK', playerId: player.id, timestamp: Date.now() }, player, gameState).isValid) {
    availableActions.push('CHECK')
  }

  // Call
  if (validateCall({ type: 'CALL', playerId: player.id, timestamp: Date.now() }, player, gameState).isValid) {
    availableActions.push('CALL')
  }

  // Raise
  if (validateRaise({ type: 'RAISE', playerId: player.id, timestamp: Date.now(), amount: gameState.minRaise + getCurrentBetToCall(gameState) }, player, gameState, options).isValid) {
    availableActions.push('RAISE')
  }

  // All-in
  if (validateAllIn({ type: 'ALL_IN', playerId: player.id, timestamp: Date.now() }, player, gameState).isValid) {
    availableActions.push('ALL_IN')
  }

  return availableActions
}