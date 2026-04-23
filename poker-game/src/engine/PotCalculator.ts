// engine/PotCalculator.ts — 底池计算引擎
import type { Player, Pot } from './types'

/**
 * 底池计算结果
 */
export interface PotCalculationResult {
  pots: Pot[] // 主池 + 边池列表
  totalPot: number // 总底池金额
}

/**
 * 计算当前底池（主池 + 可能的边池）
 *
 * 边池创建规则：
 * - 当有玩家 All-in 且其他玩家还有更多筹码时创建边池
 * - 多人不同金额 All-in 时，按金额从小到大逐级创建多个边池
 * - 如果没有人 All-in，所有人正常下注，只产生一个主池
 *
 * 示例：
 * - A All-in 100，B 跟注 200 → 主池 200（A/B 各出 100），边池 100（仅 B 有资格）
 * - A All-in 50，B All-in 100，C 跟注 150 → 主池 150（A/B/C 各出 50），边池 100（A/B 各出 50），边池 50（仅 B 有资格）
 */
export function calculatePots(players: Player[]): PotCalculationResult {
  const activePlayers = players.filter((p) => p.isActive && !p.isFolded)

  if (activePlayers.length === 0) {
    return { pots: [], totalPot: 0 }
  }

  // 获取所有玩家在本手的总下注额
  const bets = activePlayers.map((p) => p.totalBetThisHand)

  // 按下注额从小到大排序（用于创建边池）
  const sortedBets = [...bets].sort((a, b) => a - b)
  const minBet = sortedBets[0]

  // 检查是否有人 All-in（所有人的下注额不完全相同）
  const hasAllIn = new Set(bets).size > 1

  // 计算主池：每个玩家出 minBet，形成主池
  const mainPotAmount = minBet * activePlayers.length

  // 主池有资格的玩家：所有活跃玩家
  const mainPotEligible = activePlayers
    .filter((p) => p.totalBetThisHand >= minBet)
    .map((p) => p.id)

  const pots: Pot[] = [
    {
      amount: mainPotAmount,
      eligiblePlayerIds: mainPotEligible,
      isMainPot: true,
    },
  ]

  // 如果没有人 All-in（所有人下注相同），只有主池
  if (!hasAllIn) {
    const totalPot = bets.reduce((sum, bet) => sum + bet, 0)
    return { pots, totalPot }
  }

  // 计算边池（只有有人 All-in 时才需要）
  let accumulatedBet = minBet

  for (let i = 1; i < sortedBets.length; i++) {
    const currentBet = sortedBets[i]
    const betDifference = currentBet - accumulatedBet

    if (betDifference > 0) {
      // 有多少玩家参与了当前这层下注
      // 只有下注额严格大于 accumulatedBet 的玩家才参与此层
      const playersInThisLayer = activePlayers.filter(
        (p) => p.totalBetThisHand > accumulatedBet
      ).length

      const sidePotAmount = betDifference * playersInThisLayer

      // 边池有资格的玩家：下注超过 accumulatedBet 的玩家
      const sidePotEligible = activePlayers
        .filter((p) => p.totalBetThisHand > accumulatedBet)
        .map((p) => p.id)

      if (sidePotAmount > 0) {
        pots.push({
          amount: sidePotAmount,
          eligiblePlayerIds: sidePotEligible,
          isMainPot: false,
        })
      }

      accumulatedBet = currentBet
    }
  }

  const totalPot = pots.reduce((sum, pot) => sum + pot.amount, 0)

  return { pots, totalPot }
}

/**
 * 底池分配结果
 */
export interface PotAllocation {
  playerId: string
  amount: number
}

/**
 * 根据赢家分配底池
 *
 * @param pots 底池列表
 * @param winners 每池的赢家 ID 列表
 * @returns 每个玩家应得的筹码分配
 */
export function allocatePots(
  pots: Pot[],
  winnersByPot: string[][]
): Map<string, number> {
  const allocations = new Map<string, number>()

  for (let i = 0; i < pots.length; i++) {
    const pot = pots[i]
    const winners = winnersByPot[i] || []

    if (winners.length === 0) {
      // 如果没有赢家，将底池保留（或按规则分配）
      continue
    }

    // 平分底池
    const sharePerWinner = Math.floor(pot.amount / winners.length)

    for (const winnerId of winners) {
      const currentAmount = allocations.get(winnerId) || 0
      allocations.set(winnerId, currentAmount + sharePerWinner)
    }

    // 处理奇数筹码（向下取整后的余数）
    const remainder = pot.amount % winners.length
    if (remainder > 0 && winners.length > 0) {
      // 奇数筹码分配给庄家后第一位有资格的玩家
      const firstEligible = pot.eligiblePlayerIds[0]
      if (firstEligible) {
        const current = allocations.get(firstEligible) || 0
        allocations.set(firstEligible, current + remainder)
      }
    }
  }

  return allocations
}

/**
 * 计算单个底池的赢家
 * 当多个玩家手牌强度相同时返回所有赢家（平局）
 *
 * @param eligiblePlayerIds 有资格争夺此池的玩家 ID
 * @param playerCardsMap 玩家 ID 到其 7 张牌的映射
 * @returns 赢家 ID 列表
 */
export function determinePotWinners(
  eligiblePlayerIds: string[],
  playerCardsMap: Map<string, { holeCards: import('./types').Card[], communityCards: import('./types').Card[] }>,
  evaluateHand: (cards: import('./types').Card[]) => { score: number }
): string[] {
  if (eligiblePlayerIds.length === 0) return []

  const scores = eligiblePlayerIds.map((playerId) => {
    const playerData = playerCardsMap.get(playerId)
    if (!playerData) {
      return { playerId, score: -1 }
    }

    const allCards = [...playerData.holeCards, ...playerData.communityCards]
    const evaluation = evaluateHand(allCards)

    return { playerId, score: evaluation.score }
  })

  // 找出最高分
  const maxScore = Math.max(...scores.map((s) => s.score))

  // 返回所有达到最高分的玩家
  return scores
    .filter((s) => s.score === maxScore)
    .map((s) => s.playerId)
}

/**
 * 计算玩家应得的底池金额
 * 用于 UI 显示（庄家确认分配前的预览）
 *
 * @param winners 赢家 ID 列表
 * @param pot 底池
 * @returns 赢家应得的金额
 */
export function calculateWinnerShare(
  winners: string[],
  pot: Pot
): Map<string, number> {
  const shares = new Map<string, number>()

  if (winners.length === 0) return shares

  const sharePerWinner = Math.floor(pot.amount / winners.length)

  for (const winnerId of winners) {
    shares.set(winnerId, sharePerWinner)
  }

  return shares
}