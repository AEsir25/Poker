import { describe, expect, it } from 'vitest'
import type { Card, GameState, Player } from '@/engine/types'
import { GamePhase, Rank, Suit } from '@/engine/types'
import { calculatePots } from './PotCalculator'
import { settleRound, startNewRound } from './GameStateMachine'

function card(rank: Rank, suit: Suit): Card {
  return {
    rank,
    suit,
    id: `${rank}${suit}`,
  }
}

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
    phase: GamePhase.WAITING,
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
    round: 0,
    actionHistory: [],
    ...overrides,
  }
}

describe('startNewRound', () => {
  it('使用数组牌组发出手牌并保留剩余牌组', () => {
    const players = [
      createPlayer({ id: 'p1' }),
      createPlayer({ id: 'p2' }),
      createPlayer({ id: 'p3' }),
    ]
    const state = createGameState({ players })

    const nextState = startNewRound(state)

    expect(nextState.phase).toBe(GamePhase.PRE_FLOP)
    expect(nextState.deck.length).toBe(52 - players.length * 2)
    expect(nextState.players.every((player) => player.holeCards.length === 2)).toBe(true)
  })
})

describe('settleRound', () => {
  it('按每个底池的资格独立结算边池', () => {
    const playerA = createPlayer({
      id: 'A',
      chips: 0,
      holeCards: [card(Rank.Ace, Suit.Hearts), card(Rank.Ace, Suit.Diamonds)],
      currentBet: 50,
      totalBetThisHand: 50,
      isAllIn: true,
    })
    const playerB = createPlayer({
      id: 'B',
      chips: 0,
      holeCards: [card(Rank.King, Suit.Hearts), card(Rank.King, Suit.Diamonds)],
      currentBet: 100,
      totalBetThisHand: 100,
      isAllIn: true,
    })
    const playerC = createPlayer({
      id: 'C',
      chips: 0,
      holeCards: [card(Rank.Queen, Suit.Hearts), card(Rank.Queen, Suit.Diamonds)],
      currentBet: 100,
      totalBetThisHand: 100,
      isAllIn: true,
    })
    const players = [playerA, playerB, playerC]
    const communityCards = [
      card(Rank.Two, Suit.Clubs),
      card(Rank.Seven, Suit.Spades),
      card(Rank.Nine, Suit.Diamonds),
      card(Rank.Jack, Suit.Hearts),
      card(Rank.Three, Suit.Clubs),
    ]
    const state = createGameState({
      phase: GamePhase.SHOWDOWN,
      players,
      communityCards,
      pots: calculatePots(players).pots,
    })

    const settled = settleRound(state)

    expect(settled.phase).toBe(GamePhase.SETTLE)
    expect(settled.players.find((player) => player.id === 'A')?.chips).toBe(150)
    expect(settled.players.find((player) => player.id === 'B')?.chips).toBe(100)
    expect(settled.players.find((player) => player.id === 'C')?.chips).toBe(0)
    expect(settled.winner).toEqual(['A', 'B'])
  })
})
