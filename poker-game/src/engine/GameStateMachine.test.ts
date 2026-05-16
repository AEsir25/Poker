// engine/GameStateMachine.test.ts — 游戏状态机集成回归
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
  it('应发出手牌并保留数组牌组', () => {
    const players = [
      createPlayer({ id: 'A', seatIndex: 0 }),
      createPlayer({ id: 'B', seatIndex: 1 }),
      createPlayer({ id: 'C', seatIndex: 2 }),
    ]

    const nextState = startNewRound(createGameState({ players }))

    expect(nextState.phase).toBe(GamePhase.PRE_FLOP)
    expect(nextState.players.every((player) => player.holeCards.length === 2)).toBe(true)
    expect(nextState.deck.length).toBe(46)
    expect(nextState.pots[0].amount).toBe(30)
  })

  it('所有可行动玩家全押时不应无限循环', () => {
    const players = [
      createPlayer({ id: 'A', chips: 10, seatIndex: 0 }),
      createPlayer({ id: 'B', chips: 10, seatIndex: 1 }),
    ]

    const nextState = startNewRound(createGameState({ players }))

    expect(nextState.phase).toBe(GamePhase.PRE_FLOP)
    expect(nextState.players.every((player) => player.isAllIn)).toBe(true)
  })
})

describe('settleRound', () => {
  it('应按边池资格逐池结算并守恒筹码', () => {
    const communityCards = [
      card(Suit.Hearts, Rank.Two),
      card(Suit.Diamonds, Rank.Seven),
      card(Suit.Clubs, Rank.Nine),
      card(Suit.Spades, Rank.Jack),
      card(Suit.Hearts, Rank.Three),
    ]
    const players = [
      createPlayer({
        id: 'A',
        chips: 0,
        holeCards: [card(Suit.Spades, Rank.Ace), card(Suit.Diamonds, Rank.Ace)],
        isAllIn: true,
        currentBet: 50,
        totalBetThisHand: 50,
      }),
      createPlayer({
        id: 'B',
        chips: 900,
        holeCards: [card(Suit.Clubs, Rank.King), card(Suit.Diamonds, Rank.Queen)],
        currentBet: 100,
        totalBetThisHand: 100,
      }),
      createPlayer({
        id: 'C',
        chips: 900,
        holeCards: [card(Suit.Spades, Rank.King), card(Suit.Diamonds, Rank.King)],
        currentBet: 100,
        totalBetThisHand: 100,
      }),
    ]
    const initialChips = players.reduce((sum, player) => sum + player.chips + player.totalBetThisHand, 0)
    const { pots } = calculatePots(players)

    const settled = settleRound(createGameState({
      phase: GamePhase.SHOWDOWN,
      players,
      communityCards,
      pots,
    }))

    const finalChips = settled.players.reduce((sum, player) => sum + player.chips, 0)
    expect(settled.phase).toBe(GamePhase.SETTLE)
    expect(settled.players.find((player) => player.id === 'A')?.chips).toBe(150)
    expect(settled.players.find((player) => player.id === 'B')?.chips).toBe(900)
    expect(settled.players.find((player) => player.id === 'C')?.chips).toBe(1000)
    expect(finalChips).toBe(initialChips)
  })

  it('弃牌玩家投入的筹码应进入未弃牌赢家的底池', () => {
    const communityCards = [
      card(Suit.Hearts, Rank.Two),
      card(Suit.Diamonds, Rank.Seven),
      card(Suit.Clubs, Rank.Nine),
      card(Suit.Spades, Rank.Jack),
      card(Suit.Hearts, Rank.Three),
    ]
    const players = [
      createPlayer({
        id: 'A',
        chips: 900,
        holeCards: [card(Suit.Spades, Rank.Ace), card(Suit.Diamonds, Rank.Ace)],
        currentBet: 100,
        totalBetThisHand: 100,
      }),
      createPlayer({
        id: 'B',
        chips: 900,
        holeCards: [card(Suit.Clubs, Rank.King), card(Suit.Diamonds, Rank.Queen)],
        isFolded: true,
        currentBet: 100,
        totalBetThisHand: 100,
      }),
      createPlayer({
        id: 'C',
        chips: 900,
        holeCards: [card(Suit.Spades, Rank.King), card(Suit.Diamonds, Rank.King)],
        currentBet: 100,
        totalBetThisHand: 100,
      }),
    ]
    const { pots } = calculatePots(players)

    const settled = settleRound(createGameState({
      phase: GamePhase.SHOWDOWN,
      players,
      communityCards,
      pots,
    }))

    expect(settled.players.find((player) => player.id === 'A')?.chips).toBe(1200)
    expect(settled.players.find((player) => player.id === 'B')?.chips).toBe(900)
    expect(settled.players.find((player) => player.id === 'C')?.chips).toBe(900)
  })
})
