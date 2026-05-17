// engine/GameStateMachine.test.ts — 阶段状态机回归测试
import { describe, expect, it } from 'vitest'
import type { Card, GameState, Player } from '@/engine/types'
import { GamePhase, Rank, Suit } from '@/engine/types'
import { calculatePots } from '@/engine/PotCalculator'
import { settleRound, startNewRound } from '@/engine/GameStateMachine'

function card(suit: Suit, rank: Rank): Card {
  return { suit, rank, id: `${rank}${suit}` }
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
  it('应发给每个活跃玩家两张手牌并保留数组牌堆', () => {
    const players = Array.from({ length: 6 }, (_, index) =>
      createPlayer({
        id: `p${index}`,
        name: `P${index}`,
        seatIndex: index,
      })
    )
    const state = createGameState({ players })

    const newState = startNewRound(state)

    expect(newState.phase).toBe(GamePhase.PRE_FLOP)
    expect(newState.players.every((player) => player.holeCards.length === 2)).toBe(true)
    expect(newState.deck).toHaveLength(52 - players.length * 2)
    expect(Array.isArray(newState.deck)).toBe(true)
  })
})

describe('settleRound', () => {
  it('应按边池分别结算，避免把所有底池分给主池赢家', () => {
    const players = [
      createPlayer({
        id: 'A',
        name: 'A',
        chips: 0,
        holeCards: [card(Suit.Hearts, Rank.Ace), card(Suit.Diamonds, Rank.Ace)],
        isAllIn: true,
        currentBet: 50,
        totalBetThisHand: 50,
      }),
      createPlayer({
        id: 'B',
        name: 'B',
        chips: 0,
        holeCards: [card(Suit.Hearts, Rank.King), card(Suit.Diamonds, Rank.King)],
        isAllIn: true,
        currentBet: 100,
        totalBetThisHand: 100,
      }),
      createPlayer({
        id: 'C',
        name: 'C',
        chips: 850,
        holeCards: [card(Suit.Hearts, Rank.Queen), card(Suit.Diamonds, Rank.Queen)],
        currentBet: 150,
        totalBetThisHand: 150,
      }),
    ]
    const state = createGameState({
      phase: GamePhase.SHOWDOWN,
      players,
      communityCards: [
        card(Suit.Clubs, Rank.Two),
        card(Suit.Diamonds, Rank.Seven),
        card(Suit.Hearts, Rank.Nine),
        card(Suit.Spades, Rank.Jack),
        card(Suit.Clubs, Rank.Three),
      ],
      pots: calculatePots(players).pots,
    })

    const settled = settleRound(state)

    expect(settled.phase).toBe(GamePhase.SETTLE)
    expect(settled.players.find((player) => player.id === 'A')?.chips).toBe(150)
    expect(settled.players.find((player) => player.id === 'B')?.chips).toBe(100)
    expect(settled.players.find((player) => player.id === 'C')?.chips).toBe(900)
    expect(settled.winner).toEqual(['A', 'B', 'C'])
  })
})
