// engine/HandEvaluator.test.ts — 手牌评估测试
import { describe, it, expect } from 'vitest'
import { Suit, Rank, type Card } from '@/engine/types'
import { evaluateBestHand, evaluateHand, HandRank, compareHands, getHandDescription } from '@/engine/HandEvaluator'

/**
 * 测试辅助函数：创建一张牌
 */
function card(suit: Suit, rank: Rank): Card {
  return { suit, rank, id: `${rank}${suit}` }
}

// ==================== 皇家同花顺测试 ====================
describe('Royal Flush (皇家同花顺)', () => {
  it('应识别黑桃皇家同花顺', () => {
    const hand = [
      card(Suit.Spades, Rank.Ace),
      card(Suit.Spades, Rank.King),
      card(Suit.Spades, Rank.Queen),
      card(Suit.Spades, Rank.Jack),
      card(Suit.Spades, Rank.Ten),
      card(Suit.Hearts, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const result = evaluateHand(hand)
    expect(result.rank).toBe(HandRank.ROYAL_FLUSH)
    expect(result.rankName).toBe('皇家同花顺')
  })

  it('应识别红心皇家同花顺', () => {
    const hand = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Hearts, Rank.King),
      card(Suit.Hearts, Rank.Queen),
      card(Suit.Hearts, Rank.Jack),
      card(Suit.Hearts, Rank.Ten),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const result = evaluateHand(hand)
    expect(result.rank).toBe(HandRank.ROYAL_FLUSH)
  })
})

describe('evaluateBestHand (5-7 张牌评估)', () => {
  it('支持翻牌阶段 5 张牌评估', () => {
    const cards = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Diamonds, Rank.Ace),
      card(Suit.Clubs, Rank.Two),
      card(Suit.Spades, Rank.Seven),
      card(Suit.Hearts, Rank.Nine),
    ]

    const result = evaluateBestHand(cards)

    expect(result.rank).toBe(HandRank.ONE_PAIR)
  })
})

// ==================== 同花顺测试 ====================
describe('Straight Flush (同花顺)', () => {
  it('应识别普通同花顺', () => {
    const hand = [
      card(Suit.Hearts, Rank.King),
      card(Suit.Hearts, Rank.Queen),
      card(Suit.Hearts, Rank.Jack),
      card(Suit.Hearts, Rank.Ten),
      card(Suit.Hearts, Rank.Nine),
      card(Suit.Spades, Rank.Ace),
      card(Suit.Clubs, Rank.Two),
    ]

    const result = evaluateHand(hand)
    expect(result.rank).toBe(HandRank.STRAIGHT_FLUSH)
    expect(result.rankName).toBe('同花顺')
  })

  it('应识别 A-2-3-4-5 同花顺（wheel straight flush）', () => {
    const hand = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Hearts, Rank.Two),
      card(Suit.Hearts, Rank.Three),
      card(Suit.Hearts, Rank.Four),
      card(Suit.Hearts, Rank.Five),
      card(Suit.Spades, Rank.King),
      card(Suit.Clubs, Rank.Queen),
    ]

    const result = evaluateHand(hand)
    expect(result.rank).toBe(HandRank.STRAIGHT_FLUSH)
    expect(result.kickers[0]).toBe(Rank.Five) // wheel 的高牌是 5
  })
})

// ==================== 四条测试 ====================
describe('Four of a Kind (四条)', () => {
  it('应识别四条 A', () => {
    const hand = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Ace),
      card(Suit.Clubs, Rank.Ace),
      card(Suit.Diamonds, Rank.Ace),
      card(Suit.Hearts, Rank.King),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const result = evaluateHand(hand)
    expect(result.rank).toBe(HandRank.FOUR_OF_A_KIND)
    expect(result.rankName).toBe('四条')
    expect(result.kickers[0]).toBe(Rank.Ace)
  })

  it('四条 A 应该赢四条 K', () => {
    const fourA = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Ace),
      card(Suit.Clubs, Rank.Ace),
      card(Suit.Diamonds, Rank.Ace),
      card(Suit.Hearts, Rank.Two),
      card(Suit.Spades, Rank.Three),
      card(Suit.Clubs, Rank.Four),
    ]

    const fourK = [
      card(Suit.Hearts, Rank.King),
      card(Suit.Spades, Rank.King),
      card(Suit.Clubs, Rank.King),
      card(Suit.Diamonds, Rank.King),
      card(Suit.Hearts, Rank.Two),
      card(Suit.Spades, Rank.Three),
      card(Suit.Clubs, Rank.Four),
    ]

    const resultA = evaluateHand(fourA)
    const resultK = evaluateHand(fourK)

    expect(resultA.score).toBeGreaterThan(resultK.score)
  })
})

// ==================== 葫芦测试 ====================
describe('Full House (葫芦)', () => {
  it('应识别 AAAKK 葫芦', () => {
    const hand = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Ace),
      card(Suit.Clubs, Rank.Ace),
      card(Suit.Hearts, Rank.King),
      card(Suit.Spades, Rank.King),
      card(Suit.Clubs, Rank.Two),
      card(Suit.Diamonds, Rank.Three),
    ]

    const result = evaluateHand(hand)
    expect(result.rank).toBe(HandRank.FULL_HOUSE)
    expect(result.rankName).toBe('葫芦')
  })

  it('AAA KK 应该赢 KKK AA', () => {
    const aaaKK = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Ace),
      card(Suit.Clubs, Rank.Ace),
      card(Suit.Hearts, Rank.King),
      card(Suit.Spades, Rank.King),
      card(Suit.Clubs, Rank.Two),
      card(Suit.Diamonds, Rank.Three),
    ]

    const kkkAA = [
      card(Suit.Hearts, Rank.King),
      card(Suit.Spades, Rank.King),
      card(Suit.Clubs, Rank.King),
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Ace),
      card(Suit.Clubs, Rank.Two),
      card(Suit.Diamonds, Rank.Three),
    ]

    const resultA = evaluateHand(aaaKK)
    const resultK = evaluateHand(kkkAA)

    expect(resultA.score).toBeGreaterThan(resultK.score)
  })
})

// ==================== 同花测试 ====================
describe('Flush (同花)', () => {
  it('应识别同花', () => {
    const hand = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Hearts, Rank.King),
      card(Suit.Hearts, Rank.Jack),
      card(Suit.Hearts, Rank.Seven),
      card(Suit.Hearts, Rank.Four),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const result = evaluateHand(hand)
    expect(result.rank).toBe(HandRank.FLUSH)
    expect(result.rankName).toBe('同花')
  })

  it('同花 A 高应该赢同花 K 高', () => {
    const flushA = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Hearts, Rank.King),
      card(Suit.Hearts, Rank.Jack),
      card(Suit.Hearts, Rank.Seven),
      card(Suit.Hearts, Rank.Four),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const flushK = [
      card(Suit.Hearts, Rank.King),
      card(Suit.Hearts, Rank.Queen),
      card(Suit.Hearts, Rank.Jack),
      card(Suit.Hearts, Rank.Seven),
      card(Suit.Hearts, Rank.Four),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const resultA = evaluateHand(flushA)
    const resultK = evaluateHand(flushK)

    expect(resultA.score).toBeGreaterThan(resultK.score)
  })
})

// ==================== 顺子测试 ====================
describe('Straight (顺子)', () => {
  it('应识别普通顺子', () => {
    const hand = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.King),
      card(Suit.Clubs, Rank.Queen),
      card(Suit.Hearts, Rank.Jack),
      card(Suit.Diamonds, Rank.Ten),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const result = evaluateHand(hand)
    expect(result.rank).toBe(HandRank.STRAIGHT)
    expect(result.rankName).toBe('顺子')
  })

  it('应识别 A-2-3-4-5 顺子（wheel）', () => {
    const hand = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
      card(Suit.Hearts, Rank.Four),
      card(Suit.Diamonds, Rank.Five),
      card(Suit.Spades, Rank.King),
      card(Suit.Clubs, Rank.Queen),
    ]

    const result = evaluateHand(hand)
    expect(result.rank).toBe(HandRank.STRAIGHT)
    expect(result.kickers[0]).toBe(Rank.Five) // wheel 的高牌是 5
  })

  it('A-K-Q-J-10 顺子应该赢 9-8-7-6-5 顺子', () => {
    const broadway = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.King),
      card(Suit.Clubs, Rank.Queen),
      card(Suit.Hearts, Rank.Jack),
      card(Suit.Diamonds, Rank.Ten),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const lowStraight = [
      card(Suit.Hearts, Rank.Nine),
      card(Suit.Spades, Rank.Eight),
      card(Suit.Clubs, Rank.Seven),
      card(Suit.Hearts, Rank.Six),
      card(Suit.Diamonds, Rank.Five),
      card(Suit.Spades, Rank.King),
      card(Suit.Clubs, Rank.Ace),
    ]

    const resultHigh = evaluateHand(broadway)
    const resultLow = evaluateHand(lowStraight)

    expect(resultHigh.score).toBeGreaterThan(resultLow.score)
  })
})

// ==================== 三条测试 ====================
describe('Three of a Kind (三条)', () => {
  it('应识别三条', () => {
    const hand = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Ace),
      card(Suit.Clubs, Rank.Ace),
      card(Suit.Hearts, Rank.King),
      card(Suit.Diamonds, Rank.Queen),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const result = evaluateHand(hand)
    expect(result.rank).toBe(HandRank.THREE_OF_A_KIND)
    expect(result.rankName).toBe('三条')
  })
})

// ==================== 两对测试 ====================
describe('Two Pair (两对)', () => {
  it('应识别两对', () => {
    const hand = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Ace),
      card(Suit.Clubs, Rank.King),
      card(Suit.Hearts, Rank.King),
      card(Suit.Diamonds, Rank.Queen),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const result = evaluateHand(hand)
    expect(result.rank).toBe(HandRank.TWO_PAIR)
    expect(result.rankName).toBe('两对')
  })

  it('AA KK Q 应该赢 AA QQ K（对子相同时比 kicker）', () => {
    const aakkq = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Ace),
      card(Suit.Clubs, Rank.King),
      card(Suit.Hearts, Rank.King),
      card(Suit.Diamonds, Rank.Queen),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const aqqk = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Ace),
      card(Suit.Clubs, Rank.Queen),
      card(Suit.Hearts, Rank.Queen),
      card(Suit.Diamonds, Rank.King),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const result1 = evaluateHand(aakkq)
    const result2 = evaluateHand(aqqk)

    expect(result1.score).toBeGreaterThan(result2.score)
  })
})

// ==================== 一对测试 ====================
describe('One Pair (一对)', () => {
  it('应识别一对', () => {
    const hand = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Ace),
      card(Suit.Clubs, Rank.King),
      card(Suit.Hearts, Rank.Queen),
      card(Suit.Diamonds, Rank.Jack),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const result = evaluateHand(hand)
    expect(result.rank).toBe(HandRank.ONE_PAIR)
    expect(result.rankName).toBe('一对')
  })
})

// ==================== 高牌测试 ====================
describe('High Card (高牌)', () => {
  it('应识别高牌', () => {
    const hand = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.King),
      card(Suit.Clubs, Rank.Jack),
      card(Suit.Hearts, Rank.Seven),
      card(Suit.Diamonds, Rank.Four),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const result = evaluateHand(hand)
    expect(result.rank).toBe(HandRank.HIGH_CARD)
    expect(result.rankName).toBe('高牌')
  })

  it('A 高应该赢 K 高', () => {
    const aHigh = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.King),
      card(Suit.Clubs, Rank.Jack),
      card(Suit.Hearts, Rank.Seven),
      card(Suit.Diamonds, Rank.Four),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const kHigh = [
      card(Suit.Hearts, Rank.King),
      card(Suit.Spades, Rank.Queen),
      card(Suit.Clubs, Rank.Jack),
      card(Suit.Hearts, Rank.Seven),
      card(Suit.Diamonds, Rank.Four),
      card(Suit.Spades, Rank.Two),
      card(Suit.Clubs, Rank.Three),
    ]

    const resultA = evaluateHand(aHigh)
    const resultK = evaluateHand(kHigh)

    expect(resultA.score).toBeGreaterThan(resultK.score)
  })
})

// ==================== 平局测试 ====================
describe('Tie (平局)', () => {
  it('应识别平局情况', () => {
    const player1 = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Ace),
      card(Suit.Clubs, Rank.King),
      card(Suit.Hearts, Rank.Queen),
      card(Suit.Diamonds, Rank.Jack),
      card(Suit.Spades, Rank.Ten),
      card(Suit.Clubs, Rank.Nine),
    ]

    const player2 = [
      card(Suit.Diamonds, Rank.Ace),
      card(Suit.Clubs, Rank.Ace),
      card(Suit.Hearts, Rank.King),
      card(Suit.Spades, Rank.Queen),
      card(Suit.Diamonds, Rank.Jack),
      card(Suit.Spades, Rank.Ten),
      card(Suit.Hearts, Rank.Nine),
    ]

    // 两个人都是一对 A，kicker 相同
    const winners = compareHands([player1, player2])

    expect(winners.length).toBe(2) // 平局，两个人都是赢家
    expect(winners).toContain(0)
    expect(winners).toContain(1)
  })
})

// ==================== 边界测试 ====================
describe('Edge Cases (边界情况)', () => {
  it('evaluateHand 应要求恰好 7 张牌', () => {
    const sixCards = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Ace),
      card(Suit.Clubs, Rank.King),
      card(Suit.Hearts, Rank.Queen),
      card(Suit.Diamonds, Rank.Jack),
      card(Suit.Spades, Rank.Ten),
    ]

    expect(() => evaluateHand(sixCards as any)).toThrow('exactly 7 cards')
  })

  it('compareHands 应处理空数组', () => {
    const winners = compareHands([])
    expect(winners).toEqual([])
  })

  it('getHandDescription 应返回正确的描述', () => {
    // 构造一对 A 的手牌
    const hand = [
      card(Suit.Hearts, Rank.Ace),
      card(Suit.Spades, Rank.Ace),
      card(Suit.Clubs, Rank.King),
      card(Suit.Hearts, Rank.Queen),
      card(Suit.Diamonds, Rank.Seven),
      card(Suit.Spades, Rank.Four),
      card(Suit.Clubs, Rank.Two),
    ]

    const result = evaluateHand(hand)
    const desc = getHandDescription(result)

    expect(desc).toContain('一对')
    // Card.id 格式是 ${rank}${suit}，Ace 的 rank 值是 14
    expect(desc).toContain('14H') // A♥
    expect(desc).toContain('14S') // A♠
  })
})