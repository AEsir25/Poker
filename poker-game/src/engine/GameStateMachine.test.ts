// engine/GameStateMachine.test.ts — 状态机结算测试
import { describe, expect, it } from 'vitest'
import { settleRound } from './GameStateMachine'
import { GamePhase, Rank, Suit, type Card, type GameState, type Player } from './types'

function card(rank: Rank, suit: Suit): Card {
  return {
    rank,
    suit,
    id: `${rank}${suit}`,
  }
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
  it('按边池资格分别结算 all-in 摊牌', () => {
    const players = [
      player({
        id: 'A',
        name: 'A',
        holeCards: [card(Rank.Ace, Suit.Hearts), card(Rank.Ace, Suit.Diamonds)],
        currentBet: 50,
        totalBetThisHand: 50,
      }),
      player({
        id: 'B',
        name: 'B',
        holeCards: [card(Rank.King, Suit.Hearts), card(Rank.Queen, Suit.Clubs)],
        currentBet: 100,
        totalBetThisHand: 100,
      }),
      player({
        id: 'C',
        name: 'C',
        holeCards: [card(Rank.Queen, Suit.Hearts), card(Rank.Jack, Suit.Diamonds)],
        currentBet: 100,
        totalBetThisHand: 100,
      }),
    ]

    const settled = settleRound(gameState({
      players,
      communityCards: [
        card(Rank.Two, Suit.Hearts),
        card(Rank.Three, Suit.Diamonds),
        card(Rank.Four, Suit.Clubs),
        card(Rank.Nine, Suit.Spades),
        card(Rank.King, Suit.Diamonds),
      ],
    }))

    expect(settled.phase).toBe(GamePhase.SETTLE)
    expect(settled.players.find(p => p.id === 'A')?.chips).toBe(150)
    expect(settled.players.find(p => p.id === 'B')?.chips).toBe(100)
    expect(settled.players.find(p => p.id === 'C')?.chips).toBe(0)
    expect(settled.winner).toEqual(['A', 'B'])
  })
})
