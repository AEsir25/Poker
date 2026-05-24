// ai/HandStrength.ts — 牌力评估
import type { Card as CardType } from '@/engine/types'
import { Suit, Rank, GamePhase } from '@/engine/types'
import { evaluateHand } from '@/engine/HandEvaluator'

/**
 * 计算 Pre-flop 牌力（Chen Formula 简化版）
 * 输出: 0-1 之间的牌力值
 */
export function calculatePreFlopStrength(holeCards: CardType[]): number {
  if (holeCards.length !== 2) return 0

  const [c1, c2] = holeCards
  const rank1 = c1.rank
  const rank2 = c2.rank
  const maxRank = Math.max(rank1, rank2)
  const minRank = Math.min(rank1, rank2)
  const isPair = rank1 === rank2
  const isSuited = c1.suit === c2.suit
  const rankDiff = maxRank - minRank

  let score = 0

  // 基础分（按最高牌）
  if (isPair) {
    // 对子：基础分 = max(rank, 5)
    score = Math.max(maxRank / 2, 5)
  } else {
    // 高牌：A=10, K=8, Q=7, J=6, 10=5, 9=4, 8=3, 7=2, 6=1
    switch (maxRank) {
      case Rank.Ace:
        score = 10
        break
      case Rank.King:
        score = 8
        break
      case Rank.Queen:
        score = 7
        break
      case Rank.Jack:
        score = 6
        break
      case Rank.Ten:
        score = 5
        break
      case Rank.Nine:
        score = 4
        break
      case Rank.Eight:
        score = 3
        break
      case Rank.Seven:
        score = 2
        break
      case Rank.Six:
        score = 1
        break
      default:
        score = 0 // 5及以下
    }
  }

  // 同花色加成
  if (isSuited) {
    score += 2
  }

  // 连张加成
  if (rankDiff === 1) {
    score += 1
  } else if (rankDiff === 2) {
    score += 0.5
  }

  // 扣分项：牌差过大
  if (rankDiff > 3 && !isPair) {
    score -= rankDiff - 3
  }

  // 归一化到 0-1，最大分数约20
  return Math.max(0, Math.min(1, score / 20))
}

/**
 * 计算 Post-flop 牌力
 * 输出: 0-1 之间的牌力值
 */
export function calculatePostFlopStrength(
  holeCards: CardType[],
  communityCards: CardType[]
): number {
  if (holeCards.length !== 2 || communityCards.length === 0) return 0

  const allCards = [...holeCards, ...communityCards]
  if (allCards.length < 7) {
    return calculatePartialPostFlopStrength(allCards)
  }

  const handResult = evaluateHand(allCards)
  const handRank = handResult.rank

  // 基础分：牌型等级 1-10，归一化
  let score = handRank / 10

  // 听牌潜力加成
  const drawPotential = calculateDrawPotential(allCards)
  score += drawPotential * 0.2 // 最多加 0.2

  return Math.max(0, Math.min(1, score))
}

function calculatePartialPostFlopStrength(cards: CardType[]): number {
  const rankCounts = new Map<number, number>()
  const suitCounts: Record<Suit, number> = {
    [Suit.Hearts]: 0,
    [Suit.Diamonds]: 0,
    [Suit.Clubs]: 0,
    [Suit.Spades]: 0,
  }

  for (const card of cards) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1)
    suitCounts[card.suit]++
  }

  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a)
  const pairCount = counts.filter((count) => count === 2).length
  let score = 0.1

  if (Object.values(suitCounts).some((count) => count >= 5) || hasMadeStraight(cards)) {
    score = 0.5
  } else if (counts[0] === 4) {
    score = 0.8
  } else if (counts[0] === 3 && pairCount >= 1) {
    score = 0.7
  } else if (counts[0] === 3) {
    score = 0.4
  } else if (pairCount >= 2) {
    score = 0.3
  } else if (pairCount === 1) {
    score = 0.2
  }

  score += calculateDrawPotential(cards) * 0.2
  return Math.max(0, Math.min(1, score))
}

/**
 * 计算听牌潜力
 * 输出: 0-1 之间的潜力值
 */
function calculateDrawPotential(cards: CardType[]): number {
  const hasFlushDraw = isFlushDraw(cards)
  const hasStraightDraw = isStraightDraw(cards)

  if (hasFlushDraw && hasStraightDraw) {
    return 1.0 // 同花顺听
  } else if (hasFlushDraw || hasStraightDraw) {
    return 0.5 // 单听
  }
  return 0 // 无听牌
}

/**
 * 检查是否有同花听牌（差一张）
 */
function isFlushDraw(cards: CardType[]): boolean {
  const suitCounts: Record<Suit, number> = {
    [Suit.Hearts]: 0,
    [Suit.Diamonds]: 0,
    [Suit.Clubs]: 0,
    [Suit.Spades]: 0,
  }

  for (const card of cards) {
    suitCounts[card.suit]++
  }

  // 有4张同花色 → 同花听
  return Object.values(suitCounts).some(count => count === 4)
}

/**
 * 检查是否有顺子听牌（差一张）
 */
function isStraightDraw(cards: CardType[]): boolean {
  const ranks = cards.map(c => c.rank).sort((a, b) => a - b)
  const uniqueRanks = Array.from(new Set(ranks))

  // 特殊情况：A-2-3-4-5
  const hasAceLowStraightDraw = 
    uniqueRanks.includes(Rank.Ace) &&
    uniqueRanks.includes(2) &&
    uniqueRanks.includes(3) &&
    uniqueRanks.includes(4)

  if (hasAceLowStraightDraw) return true

  // 检查是否有4张连续的牌
  for (let i = 0; i <= uniqueRanks.length - 4; i++) {
    if (uniqueRanks[i + 3] - uniqueRanks[i] === 3) {
      return true
    }
  }

  return false
}

function hasMadeStraight(cards: CardType[]): boolean {
  const uniqueRanks = Array.from(new Set(cards.map(c => c.rank))).sort((a, b) => a - b)

  if (
    uniqueRanks.includes(Rank.Ace) &&
    uniqueRanks.includes(Rank.Two) &&
    uniqueRanks.includes(Rank.Three) &&
    uniqueRanks.includes(Rank.Four) &&
    uniqueRanks.includes(Rank.Five)
  ) {
    return true
  }

  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    if (uniqueRanks[i + 4] - uniqueRanks[i] === 4) {
      return true
    }
  }

  return false
}

/**
 * 计算底池赔率
 * 输入: callAmount 需要跟注的金额, pot 当前底池
 * 输出: 底池赔率 (0-1) = callAmount / (pot + callAmount)
 */
export function calculatePotOdds(callAmount: number, pot: number): number {
  if (callAmount <= 0) return 0
  const totalPot = pot + callAmount
  return callAmount / totalPot
}

/**
 * 获取当前牌力（根据阶段自动选择计算方式）
 */
export function getHandStrength(
  holeCards: CardType[],
  communityCards: CardType[],
  phase: GamePhase
): number {
  switch (phase) {
    case GamePhase.PRE_FLOP:
      return calculatePreFlopStrength(holeCards)
    case GamePhase.FLOP:
    case GamePhase.TURN:
    case GamePhase.RIVER:
    case GamePhase.SHOWDOWN:
      return calculatePostFlopStrength(holeCards, communityCards)
    default:
      return 0
  }
}