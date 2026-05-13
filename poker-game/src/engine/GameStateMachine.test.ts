import { describe, expect, it } from 'vitest'
import type { GameState, Player } from '@/engine/types'
import { GamePhase, Rank, Suit, type Card } from '@/engine/types'
import { settleRound } from '@/engine/GameStateMachine'

function card(suit: Suit, rank: Rank): Card {
  return { suit, rank, id: `${rank}${suit}` }
})

function createPlayer(overrides: Partial<Player>): Player {
  return {
    id: 'player',
    name: 'Player',
    chips: 0,
    holeCards: [],
    isNPC: false,
    isActive: true,
    isFolded: false,
    isAllIn: true,
    currentBet: 0,
    totalBetThisHand: 0,
    seatIndex: 0,
    ...overrides,
  }
}

function createState(players: Player[]): GameState {
  return {
    id: 'game',
    phase: GamePhase.SHOWDOWN,
    players,
    communityCards: [
      card(Suit.Diamonds, Rank.Two),
      card(Suit.Clubs, Rank.Seven),
      card(Suit.Hearts, Rank.Nine),
      card(Suit.Spades, Rank.Jack),
      card(Suit.Diamonds, Rank.Three),
    ],
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

describe('settleRound', () => {
  it('按边池资格分配 all-in 底池并保持筹码总量', () => {
    const players = [
      createPlayer({
        id: 'A',
        name: 'A',
        holeCards: [card(Suit.Hearts, Rank.Ace), card(Suit.Spades, Rank.Ace)],
        totalBetThisHand: 50,
        seatIndex: 0,
      }),
      createPlayer({
        id: 'B',
        name: 'B',
        holeCards: [card(Suit.Hearts, Rank.King), card(Suit.Spades, Rank.King)],
        totalBetThisHand: 100,
        seatIndex: 1,
      }),
      createPlayer({
        id: 'C',
        name: 'C',
        holeCards: [card(Suit.Hearts, Rank.Queen), card(Suit.Clubs, Rank.Ten)],
        totalBetThisHand: 150,
        seatIndex: 2,
      }),
    ]

    const settled = settleRound(createState(players))

    expect(settled.players.find(p => p.id === 'A')?.chips).toBe(150)
    expect(settled.players.find(p => p.id === 'B')?.chips).toBe(100)
    expect(settled.players.find(p => p.id === 'C')?.chips).toBe(50)
    expect(settled.players.reduce((sum, player) => sum + player.chips, 0)).toBe(300)
    expect(settled.pots.map(pot => pot.amount)).toEqual([150, 100, 50])
  })
}
