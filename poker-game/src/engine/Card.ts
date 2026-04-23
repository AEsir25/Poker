// engine/Card.ts — 扑克牌模型
import { Suit, Rank, type Card } from './types'

/**
 * 创建一张扑克牌
 * @param suit 花色
 * @param rank 点数
 * @returns 扑克牌对象
 */
export function createCard(suit: Suit, rank: Rank): Card {
  return {
    suit,
    rank,
    id: `${rank}${suit}`,
  }
}

/**
 * 创建一副完整的52张牌
 * @returns 52张牌的数组
 */
export function createFullDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of Object.values(Suit)) {
    for (const rank of Object.values(Rank)) {
      // 跳过非数字的 rank 值（TS 枚举特性）
      if (typeof rank !== 'number') continue
      deck.push(createCard(suit, rank))
    }
  }
  return deck
}

/**
 * 获取牌面的显示名称（用于 UI）
 */
export function getRankDisplayName(rank: Rank): string {
  const names: Record<Rank, string> = {
    [Rank.Two]: '2',
    [Rank.Three]: '3',
    [Rank.Four]: '4',
    [Rank.Five]: '5',
    [Rank.Six]: '6',
    [Rank.Seven]: '7',
    [Rank.Eight]: '8',
    [Rank.Nine]: '9',
    [Rank.Ten]: 'T',
    [Rank.Jack]: 'J',
    [Rank.Queen]: 'Q',
    [Rank.King]: 'K',
    [Rank.Ace]: 'A',
  }
  return names[rank] || ''
}

/**
 * 获取花色的显示名称（用于 UI）
 */
export function getSuitDisplayName(suit: Suit): string {
  const names: Record<Suit, string> = {
    [Suit.Hearts]: '♥',
    [Suit.Diamonds]: '♦',
    [Suit.Clubs]: '♣',
    [Suit.Spades]: '♠',
  }
  return names[suit] || ''
}

/**
 * 获取牌面的颜色（红或黑）
 */
export function getSuitColor(suit: Suit): 'red' | 'black' {
  return suit === Suit.Hearts || suit === Suit.Diamonds ? 'red' : 'black'
}