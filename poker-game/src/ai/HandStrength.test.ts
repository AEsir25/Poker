// ai/HandStrength.test.ts — NPC 牌力评估回归
import { describe, expect, it } from 'vitest'
import type { Card } from '@/engine/types'
import { GamePhase, Rank, Suit } from '@/engine/types'
import { getHandStrength } from './HandStrength'

function card(suit: Suit, rank: Rank): Card {
  return { suit, rank, id: `${rank}${suit}` }
}

describe('getHandStrength', () => {
  it('NPC 在翻牌和转牌阶段评估牌力时不应崩溃', () => {
    const holeCards = [
      card(Suit.Spades, Rank.Ace),
      card(Suit.Diamonds, Rank.Ace),
    ]
    const flopCards = [
      card(Suit.Hearts, Rank.Two),
      card(Suit.Diamonds, Rank.Seven),
      card(Suit.Clubs, Rank.Nine),
    ]
    const turnCards = [...flopCards, card(Suit.Spades, Rank.Jack)]

    expect(() => getHandStrength(holeCards, flopCards, GamePhase.FLOP)).not.toThrow()
    expect(() => getHandStrength(holeCards, turnCards, GamePhase.TURN)).not.toThrow()
    expect(getHandStrength(holeCards, flopCards, GamePhase.FLOP)).toBeGreaterThan(0)
  })
})
