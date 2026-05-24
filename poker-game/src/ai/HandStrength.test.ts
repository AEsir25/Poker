import { describe, expect, it } from 'vitest'
import { createCard } from '@/engine/Card'
import { GamePhase, Rank, Suit } from '@/engine/types'
import { getHandStrength } from './HandStrength'

describe('getHandStrength', () => {
  it('does not call the 7-card evaluator on flop or turn decisions', () => {
    const holeCards = [
      createCard(Suit.Hearts, Rank.Ace),
      createCard(Suit.Clubs, Rank.Ace),
    ]
    const flop = [
      createCard(Suit.Diamonds, Rank.Two),
      createCard(Suit.Clubs, Rank.Seven),
      createCard(Suit.Spades, Rank.King),
    ]
    const turn = [...flop, createCard(Suit.Hearts, Rank.Nine)]

    expect(() => getHandStrength(holeCards, flop, GamePhase.FLOP)).not.toThrow()
    expect(() => getHandStrength(holeCards, turn, GamePhase.TURN)).not.toThrow()
  })
})
