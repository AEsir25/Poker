import { describe, expect, it } from 'vitest'
import type { GameState, Player } from '@/engine/types'
import { GamePhase } from '@/engine/types'
import { isRoundComplete } from './RoundController'

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

function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'game1',
    phase: GamePhase.FLOP,
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

describe('isRoundComplete', () => {
  it('不会在玩家仍需匹配 all-in 下注时提前结束下注轮', () => {
    const allInPlayer = createPlayer({
      id: 'all-in',
      currentBet: 100,
      totalBetThisHand: 100,
      isAllIn: true,
      chips: 0,
    })
    const caller = createPlayer({
      id: 'caller',
      currentBet: 50,
      totalBetThisHand: 50,
      chips: 950,
    })
    const state = createGameState({
      players: [allInPlayer, caller],
    })
    const trackers = new Map([
      [allInPlayer.id, { playerId: allInPlayer.id, hasActed: true }],
      [caller.id, { playerId: caller.id, hasActed: false }],
    ])

    expect(isRoundComplete(state, trackers)).toBe(false)
  })

  it('所有可行动玩家匹配 all-in 下注并行动后结束下注轮', () => {
    const allInPlayer = createPlayer({
      id: 'all-in',
      currentBet: 100,
      totalBetThisHand: 100,
      isAllIn: true,
      chips: 0,
    })
    const caller = createPlayer({
      id: 'caller',
      currentBet: 100,
      totalBetThisHand: 100,
      chips: 900,
    })
    const state = createGameState({
      players: [allInPlayer, caller],
    })
    const trackers = new Map([
      [allInPlayer.id, { playerId: allInPlayer.id, hasActed: true }],
      [caller.id, { playerId: caller.id, hasActed: true }],
    ])

    expect(isRoundComplete(state, trackers)).toBe(true)
  })

  it('pre-flop 大盲已 all-in 时不再等待大盲 option', () => {
    const smallBlind = createPlayer({
      id: 'small-blind',
      currentBet: 20,
      totalBetThisHand: 20,
      chips: 980,
    })
    const bigBlind = createPlayer({
      id: 'big-blind',
      currentBet: 20,
      totalBetThisHand: 20,
      isAllIn: true,
      chips: 0,
    })
    const state = createGameState({
      phase: GamePhase.PRE_FLOP,
      dealerIndex: 1,
      players: [smallBlind, bigBlind],
    })
    const trackers = new Map([
      [smallBlind.id, { playerId: smallBlind.id, hasActed: true }],
      [bigBlind.id, { playerId: bigBlind.id, hasActed: false }],
    ])

    expect(isRoundComplete(state, trackers)).toBe(true)
  })
})
