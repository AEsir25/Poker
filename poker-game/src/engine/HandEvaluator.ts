// engine/HandEvaluator.ts — 手牌评估引擎
import { Rank, type Card } from './types'

/**
 * 牌型等级枚举（从高到低）
 * 数值越大牌型越高
 */
export enum HandRank {
  HIGH_CARD = 1,
  ONE_PAIR = 2,
  TWO_PAIR = 3,
  THREE_OF_A_KIND = 4,
  STRAIGHT = 5,
  FLUSH = 6,
  FULL_HOUSE = 7,
  FOUR_OF_A_KIND = 8,
  STRAIGHT_FLUSH = 9,
  ROYAL_FLUSH = 10,
}

/**
 * 手牌评估结果
 */
export interface HandEvaluation {
  rank: HandRank
  rankName: string
  handCards: Card[] // 最佳5张牌
  kickers: number[] // 用于比较的 Kicker 点数
  score: number // 综合评分，用于比较
}

/**
 * 生成所有 7 选 5 的组合
 * C(7,5) = 21 种
 */
function generateCombinations(cards: Card[], k: number): Card[][] {
  const result: Card[][] = []

  function backtrack(start: number, current: Card[]) {
    if (current.length === k) {
      result.push([...current])
      return
    }
    for (let i = start; i < cards.length; i++) {
      current.push(cards[i])
      backtrack(i + 1, current)
      current.pop()
    }
  }

  backtrack(0, [])
  return result
}

/**
 * 获取点数计数 Map（用于检测牌型）
 */
function getRankCountMap(ranks: Rank[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const rank of ranks) {
    map.set(rank, (map.get(rank) || 0) + 1)
  }
  return map
}

/**
 * 获取去重后的点数数组（降序）
 */
function getUniqueRanksSorted(ranks: Rank[]): Rank[] {
  return [...new Set(ranks)].sort((a, b) => b - a)
}

/**
 * 评估一手5张牌的牌型
 */
function evaluateFiveCards(cards: Card[]): HandEvaluation {
  // 按点数排序（从高到低）
  const sorted = [...cards].sort((a, b) => b.rank - a.rank)
  const ranks = sorted.map((c) => c.rank)
  const suits = sorted.map((c) => c.suit)

  // 获取点数计数
  const rankCountMap = getRankCountMap(ranks)
  const counts = Array.from(rankCountMap.values())

  // 检查同花
  const isFlush = suits.every((s) => s === suits[0])

  // 检查顺子（需要处理 A-2-3-4-5 的情况）
  const isStraight = checkStraight(ranks)

  // 检查皇家同花顺（10-J-Q-K-A 同花）
  // 排序后 ranks = [A, K, Q, J, 10]，所以 ranks[1]=King, ranks[4]=Ten
  const isRoyalFlush = isFlush && isStraight && ranks[0] === Rank.Ace && ranks[1] === Rank.King && ranks[4] === Rank.Ten

  // 检查同花顺（5张连续的同花牌）
  const isStraightFlush = isFlush && isStraight && !isRoyalFlush

  // 检查各牌型
  const hasFourOfAKind = counts.includes(4)
  const hasFullHouse = counts.includes(3) && counts.includes(2)
  const hasThreeOfAKind = counts.includes(3) && !hasFullHouse
  const pairsCount = counts.filter((c) => c === 2).length
  const hasTwoPair = pairsCount >= 2
  const hasOnePair = pairsCount === 1 && !hasThreeOfAKind

  // 确定牌型和 Kicker
  let rank: HandRank
  let rankName: string
  let kickers: number[]

  if (isRoyalFlush) {
    rank = HandRank.ROYAL_FLUSH
    rankName = '皇家同花顺'
    kickers = []
  } else if (isStraightFlush) {
    rank = HandRank.STRAIGHT_FLUSH
    rankName = '同花顺'
    kickers = [getStraightHighCard(ranks)]
  } else if (hasFourOfAKind) {
    rank = HandRank.FOUR_OF_A_KIND
    rankName = '四条'
    // 找到四条的点值
    const fourRankValue = findRankByCount(rankCountMap, 4)
    // 找到 kicker（剩余牌中最大的）
    const kickerValue = findKicker(rankCountMap, 4)
    kickers = [fourRankValue, kickerValue]
  } else if (hasFullHouse) {
    rank = HandRank.FULL_HOUSE
    rankName = '葫芦'
    const threeRankValue = findRankByCount(rankCountMap, 3)
    const pairRankValue = findRankByCount(rankCountMap, 2)
    kickers = [threeRankValue, pairRankValue]
  } else if (isFlush) {
    rank = HandRank.FLUSH
    rankName = '同花'
    kickers = ranks // 所有5张牌按点数排序作为 kicker
  } else if (isStraight) {
    rank = HandRank.STRAIGHT
    rankName = '顺子'
    kickers = [getStraightHighCard(ranks)]
  } else if (hasThreeOfAKind) {
    rank = HandRank.THREE_OF_A_KIND
    rankName = '三条'
    const threeRankValue = findRankByCount(rankCountMap, 3)
    // 找到两个 kicker
    const uniqueRanks = getUniqueRanksSorted(ranks).filter((r) => r !== threeRankValue)
    kickers = [threeRankValue, uniqueRanks[0] || 0, uniqueRanks[1] || 0]
  } else if (hasTwoPair) {
    rank = HandRank.TWO_PAIR
    rankName = '两对'
    // 找到两个对子的点值（从大到小排序）
    const pairRanks = getRanksByCount(rankCountMap, 2).sort((a, b) => b - a)
    // 找到 kicker（剩余牌中最大的）
    const kickerValue = findKicker(rankCountMap, ...pairRanks)
    kickers = [pairRanks[0], pairRanks[1], kickerValue]
  } else if (hasOnePair) {
    rank = HandRank.ONE_PAIR
    rankName = '一对'
    const pairRankValue = findRankByCount(rankCountMap, 2)
    // 找到三个 kicker
    const uniqueRanks = getUniqueRanksSorted(ranks).filter((r) => r !== pairRankValue)
    kickers = [pairRankValue, uniqueRanks[0] || 0, uniqueRanks[1] || 0, uniqueRanks[2] || 0]
  } else {
    rank = HandRank.HIGH_CARD
    rankName = '高牌'
    kickers = ranks
  }

  // 计算综合评分：牌型等级 * 100000000 + 各 Kicker 加权
  const score = calculateScore(rank, kickers)

  return { rank, rankName, handCards: sorted, kickers, score }
}

/**
 * 找到指定点数的牌
 */
function findRankByCount(rankCountMap: Map<number, number>, count: number): number {
  for (const [rank, cnt] of rankCountMap) {
    if (cnt === count) return rank
  }
  return 0
}

/**
 * 找到不在指定排除列表中的最大点值
 */
function findKicker(rankCountMap: Map<number, number>, ...exclude: number[]): number {
  const excludeSet = new Set(exclude)
  const ranks = getUniqueRanksSorted([...rankCountMap.keys()])
  for (const r of ranks) {
    if (!excludeSet.has(r)) return r
  }
  return 0
}

/**
 * 找到所有指定点数的牌
 */
function getRanksByCount(rankCountMap: Map<number, number>, count: number): number[] {
  const result: number[] = []
  for (const [rank, cnt] of rankCountMap) {
    if (cnt === count) result.push(rank)
  }
  return result
}

/**
 * 检查是否是顺子
 * 包含 A-2-3-4-5 的特殊顺子
 */
function checkStraight(ranks: Rank[]): boolean {
  const uniqueRanks = getUniqueRanksSorted(ranks)

  // 普通顺子检查（5张连续）
  if (uniqueRanks.length >= 5) {
    const top5 = uniqueRanks.slice(0, 5)
    if (areConsecutive(top5)) {
      return true
    }
  }

  // 特殊顺子：A-2-3-4-5（wheel straight）
  const wheelRanks = [Rank.Ace, Rank.Five, Rank.Four, Rank.Three, Rank.Two]
  if (wheelRanks.every((r) => uniqueRanks.includes(r))) {
    return true
  }

  return false
}

/**
 * 检查数组是否连续
 */
function areConsecutive(arr: number[]): boolean {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] - arr[i + 1] !== 1) return false
  }
  return true
}

/**
 * 获取顺子的最大牌点（wheel 顺子时返回 5）
 */
function getStraightHighCard(ranks: Rank[]): number {
  const uniqueRanks = getUniqueRanksSorted(ranks)

  // 普通顺子
  if (uniqueRanks.length >= 5) {
    const top5 = uniqueRanks.slice(0, 5)
    if (areConsecutive(top5)) {
      return top5[0]
    }
  }

  // Wheel 顺子（A-2-3-4-5）
  const wheelRanks = [Rank.Ace, Rank.Five, Rank.Four, Rank.Three, Rank.Two]
  if (wheelRanks.every((r) => uniqueRanks.includes(r))) {
    return Rank.Five
  }

  return ranks[0]
}

/**
 * 计算综合评分
 */
function calculateScore(rank: HandRank, kickers: number[]): number {
  let score = rank * 10 ** 10
  for (let i = 0; i < kickers.length; i++) {
    score += kickers[i] * 10 ** (8 - i * 2)
  }
  return score
}

/**
 * 评估 5-7 张牌中的最佳 5 张组合
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error(`evaluateHand requires 5 to 7 cards, got ${cards.length}`)
  }

  const combinations = generateCombinations(cards, 5)
  let bestHand: HandEvaluation | null = null

  for (const combo of combinations) {
    const evaluation = evaluateFiveCards(combo)
    if (!bestHand || evaluation.score > bestHand.score) {
      bestHand = evaluation
    }
  }

  return bestHand!
}

/**
 * 比较多个玩家的手牌，返回赢家索引列表（支持平局）
 */
export function compareHands(playersCards: Card[][]): number[] {
  if (playersCards.length === 0) return []

  const evaluations = playersCards.map((cards) => evaluateHand(cards))
  const bestScore = Math.max(...evaluations.map((e) => e.score))

  return evaluations
    .map((e, i) => ({ score: e.score, index: i }))
    .filter(({ score }) => score === bestScore)
    .map(({ index }) => index)
}

/**
 * 获取玩家手牌的描述（用于日志）
 */
export function getHandDescription(evaluation: HandEvaluation): string {
  const rankCards = evaluation.handCards.map((c) => c.id).join('')
  return `${evaluation.rankName} (${rankCards})`
}