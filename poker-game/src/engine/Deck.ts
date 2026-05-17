// engine/Deck.ts — 牌组管理
import type { Card } from './types'
import { createFullDeck } from './Card'

/**
 * 牌组管理模块
 */
export class Deck {
  private cards: Card[]

  constructor(cards?: Card[]) {
    // 如果没有提供牌组，创建一个新的 52 张牌
    this.cards = cards ?? createFullDeck()
  }

  /**
   * 获取当前牌组中剩余的牌
   */
  getCards(): Card[] {
    return [...this.cards]
  }

  /**
   * 获取剩余牌数
   */
  get remaining(): number {
    return this.cards.length
  }

  /**
   * Fisher-Yates 洗牌算法
   * 从后向前遍历，对每张牌随机与前面的一张牌交换位置
   */
  shuffle(): void {
    const arr = this.cards
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
  }

  /**
   * 发 N 张牌
   * @param count 要发的牌数量
   * @returns 发出的牌数组和剩余牌组
   */
  deal(count: number): { dealt: Card[]; remaining: Card[] } {
    if (count < 0 || count > this.cards.length) {
      throw new Error(
        `Invalid deal count: ${count}. Remaining cards: ${this.cards.length}`
      )
    }

    const dealt = this.cards.slice(0, count)
    const remaining = this.cards.slice(count)

    return { dealt, remaining }
  }

  /**
   * 重置牌组（创建一副新牌并洗牌）
   */
  reset(): void {
    this.cards = createFullDeck()
    this.shuffle()
  }

  /**
   * 从当前牌组中移除指定的牌
   * @param cardsToRemove 要移除的牌
   */
  removeCards(cardsToRemove: Card[]): void {
    const removeIds = new Set(cardsToRemove.map((c) => c.id))
    this.cards = this.cards.filter((c) => !removeIds.has(c.id))
  }
}

/**
 * 创建一个已洗牌的新牌组
 */
export function createShuffledDeck(): Card[] {
  const deck = new Deck()
  deck.shuffle()
  return deck.getCards()
}

/**
 * 从不可变牌组数组顶部发牌，并返回剩余牌组。
 */
export function dealCards(
  cards: Card[],
  count: number
): { card: Card[]; remainingDeck: Card[] } {
  if (count < 0 || count > cards.length) {
    throw new Error(`Invalid deal count: ${count}. Remaining cards: ${cards.length}`)
  }

  return {
    card: cards.slice(0, count),
    remainingDeck: cards.slice(count),
  }
}