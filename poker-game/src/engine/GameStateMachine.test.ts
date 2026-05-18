import { describe, expect, it } from 'vitest'
import type { Card, GameState, Player } from '@/engine/types'
import { GamePhase, Rank, Suit } from '@/engine/types'
import { calculatePots } from '@/engine/PotCalculator'
import { settleRound, startNewRound } from '@/engine/GameStateMachine'

function card(id: string, rank: Rank, suit: Suit): Card {
  return { id, rank, suit }
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

describe('GameStateMachine', () => {
  it('startNewRound 应发出手牌并保留数组牌组状态', () => {
    const players = [
      createPlayer({ id: 'human', seatIndex: 0 }),
      createPlayer({ id: 'npc1', seatIndex: 1, isNPC: true }),
      createPlayer({ id: 'npc2', seatIndex: 2, isNPC: true }),
    ]

    const state = startNewRound(createGameState({ players }))

    expect(state.phase).toBe(GamePhase.PRE_FLOP)
    expect(state.players.every(player => player.holeCards.length === 2)).toBe(true)
    expect(Array.isArray(state.deck)).toBe(true)
    expect(state.deck).toHaveLength(46)
  })

  it('settleRound 应按边池资格分别分配 All-in 底池', () => {
    const communityCards = [
      card('2h', Rank.Two, Suit.Hearts),
      card('7d', Rank.Seven, Suit.Diamonds),
      card('9c', Rank.Nine, Suit.Clubs),
      card('js', Rank.Jack, Suit.Spades),
      card('qh', Rank.Queen, Suit.Hearts),
    ]
    const players = [
      createPlayer({
        id: 'A',
        chips: 0,
        holeCards: [card('ah', Rank.Ace, Suit.Hearts), card('ad', Rank.Ace, Suit.Diamonds)],
        isAllIn: true,
        currentBet: 50,
        totalBetThisHand: 50,
      }),
      createPlayer({
        id: 'B',
        chips: 0,
        holeCards: [card('kh', Rank.King, Suit.Hearts), card('kd', Rank.King, Suit.Diamonds)],
        isAllIn: true,
        currentBet: 100,
        totalBetThisHand: 100,
      }),
      createPlayer({
        id: 'C',
        chips: 0,
        holeCards: [card('3s', Rank.Three, Suit.Spades), card('4s', Rank.Four, Suit.Spades)],
        isAllIn: true,
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

    expect(settled.phase).toBe(GamePhase.SETTLE)
    expect(settled.players.find(player => player.id === 'A')?.chips).toBe(150)
    expect(settled.players.find(player => player.id === 'B')?.chips).toBe(100)
    expect(settled.players.find(player => player.id === 'C')?.chips).toBe(0)
    expect(settled.winner).toEqual(['A', 'B'])
  })
})
