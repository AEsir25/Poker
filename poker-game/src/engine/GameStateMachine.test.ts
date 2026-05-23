// engine/GameStateMachine.test.ts — 状态机回归测试
import { describe, expect, it } from 'vitest'
import { createCard } from '@/engine/Card'
import type { GameState, Player } from '@/engine/types'
import { GamePhase, Rank, Suit } from '@/engine/types'
import { settleRound, startNewRound } from '@/engine/GameStateMachine'

function card(suit: Suit, rank: Rank) {
  return createCard(suit, rank)
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
  it('应使用数组牌组发手牌并保留剩余牌', () => {
    const state = createGameState({
      players: [
        createPlayer({ id: 'A', seatIndex: 0 }),
        createPlayer({ id: 'B', seatIndex: 1 }),
        createPlayer({ id: 'C', seatIndex: 2 }),
      ],
    })

    const nextState = startNewRound(state)

    expect(nextState.phase).toBe(GamePhase.PRE_FLOP)
    expect(nextState.players.every((p) => p.holeCards.length === 2)).toBe(true)
    expect(nextState.deck).toHaveLength(46)
    expect(nextState.pots[0].amount).toBe(30)
  })
})

describe('settleRound', () => {
  it('多人摊牌时应按边池分别分配筹码', () => {
    const communityCards = [
      card(Suit.Hearts, Rank.Two),
      card(Suit.Diamonds, Rank.Seven),
      card(Suit.Clubs, Rank.Nine),
      card(Suit.Hearts, Rank.Jack),
      card(Suit.Spades, Rank.Three),
    ]
    const players = [
      createPlayer({
        id: 'A',
        chips: 0,
        isAllIn: true,
        totalBetThisHand: 100,
        holeCards: [card(Suit.Hearts, Rank.Ace), card(Suit.Spades, Rank.Ace)],
      }),
      createPlayer({
        id: 'B',
        chips: 800,
        totalBetThisHand: 200,
        holeCards: [card(Suit.Hearts, Rank.King), card(Suit.Spades, Rank.King)],
      }),
      createPlayer({
        id: 'C',
        chips: 800,
        totalBetThisHand: 200,
        holeCards: [card(Suit.Hearts, Rank.Queen), card(Suit.Spades, Rank.Queen)],
      }),
    ]
    const state = createGameState({
      phase: GamePhase.SHOWDOWN,
      players,
      communityCards,
    })

    const settled = settleRound(state)

    expect(settled.phase).toBe(GamePhase.SETTLE)
    expect(settled.pots.map((pot) => pot.amount)).toEqual([300, 200])
    expect(settled.players.find((p) => p.id === 'A')?.chips).toBe(300)
    expect(settled.players.find((p) => p.id === 'B')?.chips).toBe(1000)
    expect(settled.players.find((p) => p.id === 'C')?.chips).toBe(800)
    expect(settled.winner).toEqual(['A', 'B'])
  })

  it('弃牌玩家已投入的筹码应归剩余玩家', () => {
    const players = [
      createPlayer({ id: 'A', chips: 900, totalBetThisHand: 100 }),
      createPlayer({
        id: 'B',
        chips: 900,
        isFolded: true,
        totalBetThisHand: 100,
      }),
    ]
    const state = createGameState({
      phase: GamePhase.PRE_FLOP,
      players,
    })

    const settled = settleRound(state)

    expect(settled.players.find((p) => p.id === 'A')?.chips).toBe(1100)
    expect(settled.winner).toEqual(['A'])
  })
})
