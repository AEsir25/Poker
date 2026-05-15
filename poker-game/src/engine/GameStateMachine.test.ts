import { describe, expect, it } from 'vitest'
import { settleRound } from './GameStateMachine'
import { GamePhase, Rank, Suit, type Card, type GameState, type Player } from './types'

function card(suit: Suit, rank: Rank): Card {
  return {
    suit,
    rank,
    id: `${rank}${suit}`,
  }
}

function player(id: string, holeCards: Card[], chips: number): Player {
  return {
    id,
    name: id,
    chips,
    holeCards,
    isNPC: false,
    isActive: true,
    isFolded: false,
    isAllIn: chips === 0,
    currentBet: 0,
    totalBetThisHand: 0,
    seatIndex: 0,
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
  it('按每个边池的资格分别结算，短码玩家不能赢取边池', () => {
    const communityCards = [
      card(Suit.Hearts, Rank.Two),
      card(Suit.Diamonds, Rank.Three),
      card(Suit.Clubs, Rank.Four),
      card(Suit.Spades, Rank.Eight),
      card(Suit.Hearts, Rank.Nine),
    ]

    const shortStack = player('A', [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Ace),
    ], 0)
    const sidePotWinner = player('B', [
      card(Suit.Hearts, Rank.King),
      card(Suit.Spades, Rank.King),
    ], 0)
    const caller = player('C', [
      card(Suit.Hearts, Rank.Queen),
      card(Suit.Spades, Rank.Queen),
    ], 0)

    const settled = settleRound(gameState({
      players: [shortStack, sidePotWinner, caller],
      communityCards,
      pots: [
        { amount: 300, eligiblePlayerIds: ['A', 'B', 'C'], isMainPot: true },
        { amount: 200, eligiblePlayerIds: ['B', 'C'], isMainPot: false },
      ],
    }))

    expect(settled.phase).toBe(GamePhase.SETTLE)
    expect(settled.players.find(p => p.id === 'A')?.chips).toBe(300)
    expect(settled.players.find(p => p.id === 'B')?.chips).toBe(200)
    expect(settled.players.find(p => p.id === 'C')?.chips).toBe(0)
    expect(settled.winner).toEqual(['A', 'B'])
  })
})
