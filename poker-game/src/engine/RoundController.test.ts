import { describe, expect, it } from 'vitest'
import type { GameState, Player } from '@/engine/types'
import { GamePhase } from '@/engine/types'
import { initActionTrackers, isRoundComplete } from '@/engine/RoundController'

function createPlayer(overrides: Partial<Player> = {}): Player {
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

function createGameState(players: Player[]): GameState {
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
  it('does not complete while an actionable player has not matched an all-in bet', () => {
    const players = [
      createPlayer({ id: 'A', currentBet: 100, isAllIn: true }),
      createPlayer({ id: 'B', currentBet: 50 }),
      createPlayer({ id: 'C', currentBet: 50 }),
    ]
    const trackers = initActionTrackers(players)
    trackers.get('B')!.hasActed = true
    trackers.get('C')!.hasActed = true

    expect(isRoundComplete(createGameState(players), trackers)).toBe(false)
  })
})
