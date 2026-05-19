// engine/GameStateMachine.test.ts — 状态机关键回归测试
import { describe, expect, it } from 'vitest'
import type { Card, GameState, Player } from '@/engine/types'
import { GamePhase, Rank, Suit } from '@/engine/types'
import { settleRound, startNewRound } from '@/engine/GameStateMachine'

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit, id: `${rank}${suit}` }
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
    players: [
      createPlayer({ id: 'p1', name: 'P1', seatIndex: 0 }),
      createPlayer({ id: 'p2', name: 'P2', seatIndex: 1 }),
    ],
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
  it('应能从冻结状态开始新一手，避免 Zustand/Immer 状态被直接改写而崩溃', () => {
    const state = createGameState()
    for (const player of state.players) {
      Object.freeze(player.holeCards)
      Object.freeze(player)
    }
    Object.freeze(state.players)
    Object.freeze(state)

    const nextState = startNewRound(state)

    expect(nextState.phase).toBe(GamePhase.PRE_FLOP)
    expect(nextState.players.every((player) => player.holeCards.length === 2)).toBe(true)
    expect(state.players.every((player) => player.holeCards.length === 0)).toBe(true)
  })
})

describe('settleRound', () => {
  it('应按边池分别结算，All-in 主池赢家不应拿走边池', () => {
    const communityCards = [
      card(Rank.Two, Suit.Hearts),
      card(Rank.Seven, Suit.Diamonds),
      card(Rank.Nine, Suit.Clubs),
      card(Rank.Jack, Suit.Spades),
      card(Rank.Three, Suit.Hearts),
    ]
    const state = createGameState({
      phase: GamePhase.SHOWDOWN,
      communityCards,
      players: [
        createPlayer({
          id: 'A',
          name: 'A',
          chips: 0,
          holeCards: [card(Rank.Ace, Suit.Hearts), card(Rank.Ace, Suit.Diamonds)],
          isAllIn: true,
          currentBet: 50,
          totalBetThisHand: 50,
        }),
        createPlayer({
          id: 'B',
          name: 'B',
          chips: 900,
          holeCards: [card(Rank.King, Suit.Hearts), card(Rank.King, Suit.Diamonds)],
          currentBet: 100,
          totalBetThisHand: 100,
        }),
        createPlayer({
          id: 'C',
          name: 'C',
          chips: 900,
          holeCards: [card(Rank.Queen, Suit.Hearts), card(Rank.Queen, Suit.Diamonds)],
          currentBet: 100,
          totalBetThisHand: 100,
        }),
      ],
    })

    const settled = settleRound(state)

    expect(settled.players.find((player) => player.id === 'A')?.chips).toBe(150)
    expect(settled.players.find((player) => player.id === 'B')?.chips).toBe(1000)
    expect(settled.players.find((player) => player.id === 'C')?.chips).toBe(900)
    expect(settled.winner).toEqual(['A', 'B'])
  })
})
