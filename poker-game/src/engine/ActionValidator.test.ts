// engine/ActionValidator.test.ts — 行动验证测试
import { describe, it, expect } from 'vitest'
import type { GameState, Player, PlayerAction } from '@/engine/types'
import { GamePhase } from '@/engine/types'
import {
  validateFold,
  validateCheck,
  validateCall,
  validateRaise,
  validateAllIn,
  validateAction,
  getAvailableActions,
  getCurrentBetToCall,
} from '@/engine/ActionValidator'

/**
 * 测试辅助函数：创建玩家
 */
function createPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player1',
    name: 'Player 1',
    chips: 1000,
    holeCards: [],
    isNPC: false,
    isActive: true,
    isFolded: false,
    isAllIn: false,
    currentBet: 0,
    totalBetThisHand: 0,
    seatIndex: 0,
    ...overrides,
  }
}

/**
 * 测试辅助函数：创建游戏状态
 */
function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'game1',
    phase: GamePhase.PRE_FLOP,
    players: [],
    communityCards: [],
    deck: [],
    pots: [],
    dealerIndex: 0,
    currentPlayerIndex: 0,
    smallBlind: 10,
    bigBlind: 20,
    minRaise: 20,
    lastRaiseAmount: 20,
    round: 1,
    actionHistory: [],
    ...overrides,
  }
}

// ==================== Fold 测试 ====================
describe('Fold (弃牌)', () => {
  it('活跃玩家可以弃牌', () => {
    const player = createPlayer({ isActive: true, isFolded: false })
    const gameState = createGameState()

    const result = validateFold(
      { type: 'FOLD', playerId: player.id, timestamp: Date.now() },
      player,
      gameState
    )

    expect(result.isValid).toBe(true)
  })

  it('非活跃玩家不能弃牌', () => {
    const player = createPlayer({ isActive: false })
    const gameState = createGameState()

    const result = validateFold(
      { type: 'FOLD', playerId: player.id, timestamp: Date.now() },
      player,
      gameState
    )

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toContain('非活跃玩家')
  })

  it('已弃牌玩家不能再次弃牌', () => {
    const player = createPlayer({ isFolded: true })
    const gameState = createGameState()

    const result = validateFold(
      { type: 'FOLD', playerId: player.id, timestamp: Date.now() },
      player,
      gameState
    )

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toContain('已经弃牌')
  })

  it('All-in 玩家不能弃牌', () => {
    const player = createPlayer({ isAllIn: true })
    const gameState = createGameState()

    const result = validateFold(
      { type: 'FOLD', playerId: player.id, timestamp: Date.now() },
      player,
      gameState
    )

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toContain('All-in')
  })
})

// ==================== Check 测试 ====================
describe('Check (过牌)', () => {
  it('无人下注时可以过牌', () => {
    const player = createPlayer({ currentBet: 0 })
    const gameState = createGameState({ players: [player] })

    const result = validateCheck(
      { type: 'CHECK', playerId: player.id, timestamp: Date.now() },
      player,
      gameState
    )

    expect(result.isValid).toBe(true)
  })

  it('有未匹配注时不能过牌', () => {
    const player = createPlayer({ currentBet: 50 })
    const otherPlayer = createPlayer({ id: 'player2', currentBet: 100 })
    const gameState = createGameState({
      players: [player, otherPlayer],
    })

    const result = validateCheck(
      { type: 'CHECK', playerId: player.id, timestamp: Date.now() },
      player,
      gameState
    )

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toContain('有未匹配的下注')
  })

  it('已下注到最高金额可以过牌', () => {
    const player = createPlayer({ currentBet: 100 })
    const otherPlayer = createPlayer({ id: 'player2', currentBet: 100 })
    const gameState = createGameState({
      players: [player, otherPlayer],
      minRaise: 20,
    })

    const result = validateCheck(
      { type: 'CHECK', playerId: player.id, timestamp: Date.now() },
      player,
      gameState
    )

    expect(result.isValid).toBe(true)
  })

  it('All-in 玩家不能过牌', () => {
    const player = createPlayer({ isAllIn: true })
    const gameState = createGameState()

    const result = validateCheck(
      { type: 'CHECK', playerId: player.id, timestamp: Date.now() },
      player,
      gameState
    )

    expect(result.isValid).toBe(false)
  })
})

// ==================== Call 测试 ====================
describe('Call (跟注)', () => {
  it('有未匹配注时可以跟注', () => {
    const player = createPlayer({ currentBet: 50 })
    const otherPlayer = createPlayer({ id: 'player2', currentBet: 100 })
    const gameState = createGameState({
      players: [player, otherPlayer],
    })

    const result = validateCall(
      { type: 'CALL', playerId: player.id, timestamp: Date.now() },
      player,
      gameState
    )

    expect(result.isValid).toBe(true)
  })

  it('没有未匹配注时不能跟注', () => {
    const player = createPlayer({ currentBet: 100 })
    const otherPlayer = createPlayer({ id: 'player2', currentBet: 100 })
    const gameState = createGameState({
      players: [player, otherPlayer],
    })

    const result = validateCall(
      { type: 'CALL', playerId: player.id, timestamp: Date.now() },
      player,
      gameState
    )

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toContain('不需要跟注')
  })

  it('已弃牌玩家不能跟注', () => {
    const player = createPlayer({ isFolded: true })
    const gameState = createGameState()

    const result = validateCall(
      { type: 'CALL', playerId: player.id, timestamp: Date.now() },
      player,
      gameState
    )

    expect(result.isValid).toBe(false)
  })
})

// ==================== Raise 测试 ====================
describe('Raise (加注)', () => {
  it('可以加注到足够的金额', () => {
    const player = createPlayer({ currentBet: 50, chips: 1000 })
    const otherPlayer = createPlayer({ id: 'player2', currentBet: 100 })
    const gameState = createGameState({
      players: [player, otherPlayer],
      minRaise: 20,
    })

    // 最低需要加注到 100 + 20 = 120
    const result = validateRaise(
      { type: 'RAISE', playerId: player.id, timestamp: Date.now(), amount: 120 },
      player,
      gameState
    )

    expect(result.isValid).toBe(true)
  })

  it('加注金额不足应被拒绝', () => {
    const player = createPlayer({ currentBet: 50, chips: 1000 })
    const otherPlayer = createPlayer({ id: 'player2', currentBet: 100 })
    const gameState = createGameState({
      players: [player, otherPlayer],
      minRaise: 20,
    })

    // 最低需要到 120
    const result = validateRaise(
      { type: 'RAISE', playerId: player.id, timestamp: Date.now(), amount: 110 },
      player,
      gameState
    )

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toContain('加注金额不足')
  })

  it('筹码不足时应被拒绝', () => {
    const player = createPlayer({ currentBet: 50, chips: 30 })
    const otherPlayer = createPlayer({ id: 'player2', currentBet: 100 })
    const gameState = createGameState({
      players: [player, otherPlayer],
      minRaise: 20,
    })

    const result = validateRaise(
      { type: 'RAISE', playerId: player.id, timestamp: Date.now(), amount: 120 },
      player,
      gameState
    )

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toContain('筹码不足')
  })

  it('达到加注上限时应被拒绝', () => {
    const player = createPlayer({ currentBet: 50, chips: 1000 })
    const otherPlayer = createPlayer({ id: 'player2', currentBet: 100 })
    const gameState = createGameState({
      players: [player, otherPlayer],
      minRaise: 20,
      actionHistory: [
        {
          playerId: 'other',
          playerName: 'Other',
          action: { type: 'RAISE', playerId: 'other', timestamp: Date.now(), amount: 50 },
          phase: GamePhase.PRE_FLOP,
          potAfter: 200,
        },
      ],
    })

    const result = validateRaise(
      { type: 'RAISE', playerId: player.id, timestamp: Date.now(), amount: 120 },
      player,
      gameState,
      { maxRaisesPerRound: 1 } // 只允许 1 次加注
    )

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toContain('加注上限')
  })

  it('All-in 玩家不能加注', () => {
    const player = createPlayer({ isAllIn: true, chips: 0 })
    const gameState = createGameState()

    const result = validateRaise(
      { type: 'RAISE', playerId: player.id, timestamp: Date.now(), amount: 100 },
      player,
      gameState
    )

    expect(result.isValid).toBe(false)
  })
})

// ==================== All-in 测试 ====================
describe('All-in (全押)', () => {
  it('有筹码的玩家可以全押', () => {
    const player = createPlayer({ chips: 500 })
    const gameState = createGameState()

    const result = validateAllIn(
      { type: 'ALL_IN', playerId: player.id, timestamp: Date.now() },
      player,
      gameState
    )

    expect(result.isValid).toBe(true)
  })

  it('没有筹码的玩家不能全押', () => {
    const player = createPlayer({ chips: 0 })
    const gameState = createGameState()

    const result = validateAllIn(
      { type: 'ALL_IN', playerId: player.id, timestamp: Date.now() },
      player,
      gameState
    )

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toContain('没有可下的筹码')
  })

  it('已弃牌玩家不能全押', () => {
    const player = createPlayer({ isFolded: true, chips: 500 })
    const gameState = createGameState()

    const result = validateAllIn(
      { type: 'ALL_IN', playerId: player.id, timestamp: Date.now() },
      player,
      gameState
    )

    expect(result.isValid).toBe(false)
  })
})

// ==================== 统一验证接口测试 ====================
describe('validateAction (统一验证)', () => {
  it('应正确路由到各验证函数', () => {
    const player = createPlayer({ chips: 1000 })
    const gameState = createGameState()

    expect(validateAction({ type: 'FOLD', playerId: player.id, timestamp: Date.now() }, player, gameState).isValid).toBe(true)
    expect(validateAction({ type: 'CHECK', playerId: player.id, timestamp: Date.now() }, player, gameState).isValid).toBe(true)
    // CALL 在没有未匹配下注时是无效的
    expect(validateAction({ type: 'CALL', playerId: player.id, timestamp: Date.now() }, player, gameState).isValid).toBe(false)
    expect(validateAction({ type: 'ALL_IN', playerId: player.id, timestamp: Date.now() }, player, gameState).isValid).toBe(true)
  })

  it('应拒绝未知行动类型', () => {
    const player = createPlayer()
    const gameState = createGameState()

    const unknownAction = {
      type: 'UNKNOWN',
      playerId: player.id,
      timestamp: Date.now(),
    } as unknown as PlayerAction

    const result = validateAction(unknownAction, player, gameState)

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toContain('未知的行动类型')
  })
})

// ==================== 辅助函数测试 ====================
describe('Helper Functions (辅助函数)', () => {
  it('getCurrentBetToCall 应返回最大下注额', () => {
    const players = [
      createPlayer({ id: 'p1', currentBet: 50 }),
      createPlayer({ id: 'p2', currentBet: 100 }),
      createPlayer({ id: 'p3', currentBet: 75 }),
    ]
    const gameState = createGameState({ players })

    expect(getCurrentBetToCall(gameState)).toBe(100)
  })

  it('getCurrentBetToCall 应计入 All-in 玩家下注额', () => {
    const players = [
      createPlayer({ id: 'p1', currentBet: 100, isAllIn: true }),
      createPlayer({ id: 'p2', currentBet: 150 }),
    ]
    const gameState = createGameState({ players })

    expect(getCurrentBetToCall(gameState)).toBe(150)
  })

  it('getCurrentBetToCall 不应因最高下注玩家 All-in 而低估跟注额', () => {
    const players = [
      createPlayer({ id: 'p1', currentBet: 200, isAllIn: true }),
      createPlayer({ id: 'p2', currentBet: 100 }),
    ]
    const gameState = createGameState({ players })

    expect(getCurrentBetToCall(gameState)).toBe(200)
  })

  it('getCurrentBetToCall 应跳过弃牌玩家', () => {
    const players = [
      createPlayer({ id: 'p1', currentBet: 100, isFolded: true }),
      createPlayer({ id: 'p2', currentBet: 150 }),
    ]
    const gameState = createGameState({ players })

    expect(getCurrentBetToCall(gameState)).toBe(150)
  })
})

// ==================== getAvailableActions 测试 ====================
describe('getAvailableActions (可用行动)', () => {
  it('无人下注时应有 Check/Fold/Raise/All-in', () => {
    const player = createPlayer({ currentBet: 0, chips: 1000 })
    const gameState = createGameState({ players: [player] })

    const actions = getAvailableActions(player, gameState)

    expect(actions).toContain('CHECK')
    expect(actions).toContain('FOLD')
    expect(actions).toContain('RAISE')
    expect(actions).toContain('ALL_IN')
    expect(actions).not.toContain('CALL')
  })

  it('有人下注时有 Call/Fold/Raise/All-in', () => {
    const player = createPlayer({ currentBet: 50, chips: 1000 })
    const otherPlayer = createPlayer({ id: 'p2', currentBet: 100 })
    const gameState = createGameState({ players: [player, otherPlayer] })

    const actions = getAvailableActions(player, gameState)

    expect(actions).toContain('CALL')
    expect(actions).toContain('FOLD')
    expect(actions).toContain('RAISE')
    expect(actions).toContain('ALL_IN')
    expect(actions).not.toContain('CHECK')
  })

  it('筹码不足时不应有 Raise', () => {
    const player = createPlayer({ currentBet: 50, chips: 20 })
    const otherPlayer = createPlayer({ id: 'p2', currentBet: 100 })
    const gameState = createGameState({
      players: [player, otherPlayer],
      minRaise: 20,
    })

    const actions = getAvailableActions(player, gameState)

    expect(actions).not.toContain('RAISE')
  })

  it('All-in 玩家没有任何可用行动', () => {
    const player = createPlayer({ isAllIn: true, chips: 0 })
    const gameState = createGameState()

    const actions = getAvailableActions(player, gameState)

    // All-in 后不能做任何行动
    expect(actions).toEqual([])
  })
})