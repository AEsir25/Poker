import { describe, expect, it } from 'vitest'
import { isRoundComplete } from './RoundController'
import { GamePhase, type GameState, type Player } from './types'

function player(overrides: Partial<Player>): Player {
  return {
    id: 'player',
    name: 'Player',
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

function gameState(players: Player[]): GameState {
  return {
    id: 'game',
    phase: GamePhase.FLOP,
    players,
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
  }
}

describe('isRoundComplete', () => {
  it('未 All-in 玩家必须匹配 All-in 最高注后下注轮才结束', () => {
    const players = [
      player({ id: 'A', currentBet: 100, totalBetThisHand: 100, chips: 0, isAllIn: true }),
      player({ id: 'B', currentBet: 20, totalBetThisHand: 20 }),
    ]
    const trackers = new Map([
      ['A', { playerId: 'A', hasActed: true }],
      ['B', { playerId: 'B', hasActed: true }],
    ])

    expect(isRoundComplete(gameState(players), trackers)).toBe(false)

    const matchedPlayers = [
      players[0],
      { ...players[1], currentBet: 100, totalBetThisHand: 100 },
    ]
    expect(isRoundComplete(gameState(matchedPlayers), trackers)).toBe(true)
  })
})
