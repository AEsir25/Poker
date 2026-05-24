import { describe, expect, it } from 'vitest'
import type { GameState, Player } from '@/engine/types'
import { GamePhase, Rank, Suit } from '@/engine/types'
import { createCard } from '@/engine/Card'
import { calculatePots } from '@/engine/PotCalculator'
import { settleRound, startNewRound } from '@/engine/GameStateMachine'

function createPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player',
    name: 'Player',
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
    id: 'game',
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

function freezeGameState(state: GameState): GameState {
  for (const player of state.players) {
    Object.freeze(player.holeCards)
    Object.freeze(player)
  }
  Object.freeze(state.players)
  return Object.freeze(state)
}

describe('startNewRound', () => {
  it('does not mutate frozen store state when dealing cards and posting blinds', () => {
    const players = [
      createPlayer({ id: 'A', seatIndex: 0 }),
      createPlayer({ id: 'B', seatIndex: 1 }),
      createPlayer({ id: 'C', seatIndex: 2 }),
    ]
    const frozenState = freezeGameState(createGameState({ players }))

    const nextState = startNewRound(frozenState)

    expect(nextState.phase).toBe(GamePhase.PRE_FLOP)
    expect(nextState.players.every((player) => player.holeCards.length === 2)).toBe(true)
    expect(nextState.deck.length).toBe(46)
    expect(nextState.players[1].chips).toBe(990)
    expect(nextState.players[2].chips).toBe(980)
    expect(frozenState.players.every((player) => player.holeCards.length === 0)).toBe(true)
  })
})

describe('settleRound', () => {
  it('settles each side pot only among eligible players', () => {
    const communityCards = [
      createCard(Suit.Hearts, Rank.Two),
      createCard(Suit.Diamonds, Rank.Seven),
      createCard(Suit.Clubs, Rank.Nine),
      createCard(Suit.Diamonds, Rank.Jack),
      createCard(Suit.Spades, Rank.King),
    ]
    const players = [
      createPlayer({
        id: 'A',
        chips: 0,
        holeCards: [createCard(Suit.Hearts, Rank.Ace), createCard(Suit.Diamonds, Rank.Ace)],
        totalBetThisHand: 50,
        currentBet: 50,
        isAllIn: true,
      }),
      createPlayer({
        id: 'B',
        chips: 900,
        holeCards: [createCard(Suit.Hearts, Rank.Queen), createCard(Suit.Diamonds, Rank.Queen)],
        totalBetThisHand: 100,
        currentBet: 100,
      }),
      createPlayer({
        id: 'C',
        chips: 900,
        holeCards: [createCard(Suit.Hearts, Rank.Three), createCard(Suit.Diamonds, Rank.Four)],
        totalBetThisHand: 100,
        currentBet: 100,
      }),
    ]
    const pots = calculatePots(players).pots

    const settled = settleRound(createGameState({
      phase: GamePhase.SHOWDOWN,
      players,
      communityCards,
      pots,
    }))

    expect(settled.players.find((player) => player.id === 'A')?.chips).toBe(150)
    expect(settled.players.find((player) => player.id === 'B')?.chips).toBe(1000)
    expect(settled.players.find((player) => player.id === 'C')?.chips).toBe(900)
    expect(settled.winner).toEqual(['A', 'B'])
  })
})
