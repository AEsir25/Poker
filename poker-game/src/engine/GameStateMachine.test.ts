import { describe, expect, it } from 'vitest'
import { settleRound } from './GameStateMachine'
import { calculatePots } from './PotCalculator'
import { GamePhase, Rank, Suit, type Card, type GameState, type Player } from './types'

function card(suit: Suit, rank: Rank): Card {
  return { suit, rank, id: `${rank}${suit}` }
}

function player(overrides: Partial<Player>): Player {
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

function gameState(overrides: Partial<GameState>): GameState {
  return {
    id: 'game',
    phase: GamePhase.SHOWDOWN,
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

describe('settleRound', () => {
  it('按每个边池的资格分别结算，避免短筹码玩家赢走无资格边池', () => {
    const players = [
      player({
        id: 'A',
        name: 'Short stack',
        totalBetThisHand: 50,
        holeCards: [card(Suit.Spades, Rank.Ace), card(Suit.Spades, Rank.Five)],
      }),
      player({
        id: 'B',
        name: 'Middle stack',
        totalBetThisHand: 100,
        holeCards: [card(Suit.Hearts, Rank.King), card(Suit.Diamonds, Rank.King)],
      }),
      player({
        id: 'C',
        name: 'Big stack',
        chips: 850,
        totalBetThisHand: 150,
        holeCards: [card(Suit.Hearts, Rank.Queen), card(Suit.Diamonds, Rank.Queen)],
      }),
    ]
    const communityCards = [
      card(Suit.Hearts, Rank.Two),
      card(Suit.Diamonds, Rank.Three),
      card(Suit.Clubs, Rank.Four),
      card(Suit.Spades, Rank.Nine),
      card(Suit.Spades, Rank.Jack),
    ]

    const settled = settleRound(
      gameState({
        players,
        communityCards,
        pots: calculatePots(players).pots,
      })
    )

    expect(settled.players.find(p => p.id === 'A')?.chips).toBe(150)
    expect(settled.players.find(p => p.id === 'B')?.chips).toBe(100)
    expect(settled.players.find(p => p.id === 'C')?.chips).toBe(900)
    expect(settled.winner).toEqual(['A', 'B', 'C'])
  })
})
