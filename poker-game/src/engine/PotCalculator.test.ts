// engine/PotCalculator.test.ts — 底池计算测试
import { describe, it, expect } from 'vitest'
import type { Player } from '@/engine/types'
import { calculatePots, allocatePots } from '@/engine/PotCalculator'

/**
 * 测试辅助函数：创建玩家
 */
function createPlayer(
  id: string,
  totalBet: number,
  isActive: boolean = true,
  isFolded: boolean = false
): Player {
  return {
    id,
    name: id,
    chips: 1000,
    holeCards: [],
    isNPC: false,
    isActive,
    isFolded,
    isAllIn: false,
    currentBet: totalBet,
    totalBetThisHand: totalBet,
    seatIndex: 0,
  }
}

// ==================== 主池测试 ====================
describe('Main Pot (主池)', () => {
  it('应正确计算无 All-in 的主池', () => {
    const players: Player[] = [
      createPlayer('player1', 100),
      createPlayer('player2', 100),
      createPlayer('player3', 100),
    ]

    const result = calculatePots(players)

    expect(result.totalPot).toBe(300)
    expect(result.pots.length).toBe(1)
    expect(result.pots[0].isMainPot).toBe(true)
    expect(result.pots[0].amount).toBe(300)
    expect(result.pots[0].eligiblePlayerIds).toEqual(['player1', 'player2', 'player3'])
  })

  it('应正确计算不同下注额的主池（有人 All-in）', () => {
    const players: Player[] = [
      createPlayer('player1', 50),   // 最小下注
      createPlayer('player2', 100), // 更大下注（正常情况，可能有人 All-in）
      createPlayer('player3', 150), // 最大下注
    ]

    const result = calculatePots(players)

    // 因为下注额不同，会产生多个底池
    expect(result.totalPot).toBe(300) // 50 + 100 + 150
    // 主池 + 2个边池
    expect(result.pots.length).toBe(3)
    expect(result.pots[0].isMainPot).toBe(true)
    expect(result.pots[0].amount).toBe(150) // 50 * 3
    expect(result.pots[0].eligiblePlayerIds).toEqual(['player1', 'player2', 'player3'])

    // 边池 1：(100-50) * 2 = 100，player2 和 player3 各出 50
    expect(result.pots[1].amount).toBe(100)
    expect(result.pots[1].eligiblePlayerIds).toEqual(['player2', 'player3'])

    // 边池 2：(150-100) * 1 = 50，只有 player3 出 50
    expect(result.pots[2].amount).toBe(50)
    expect(result.pots[2].eligiblePlayerIds).toEqual(['player3'])
  })
})

// ==================== 单人 All-in 边池测试 ====================
describe('Single Player All-in (单人 All-in)', () => {
  it('A All-in 100，B 跟注 200 → 主池 200，边池 100', () => {
    const players: Player[] = [
      createPlayer('A', 100), // All-in 100
      createPlayer('B', 200), // 跟注 200
    ]

    const result = calculatePots(players)

    expect(result.totalPot).toBe(300) // 100 + 200

    // 主池：每人出 100，共 200（A/B 各出 100）
    expect(result.pots.length).toBe(2)
    expect(result.pots[0].isMainPot).toBe(true)
    expect(result.pots[0].amount).toBe(200)
    expect(result.pots[0].eligiblePlayerIds).toEqual(['A', 'B'])

    // 边池：100（A/B 各出 50，但 A 已经没有更多筹码了）
    // 实际上 A 出 100 全部进入主池，B 额外出的 100 形成边池
    // 边池只有 B 有资格
    expect(result.pots[1].isMainPot).toBe(false)
    expect(result.pots[1].amount).toBe(100)
    expect(result.pots[1].eligiblePlayerIds).toEqual(['B'])
  })

  it('A All-in 100，B 跟注 100，C 跟注 200 → 主池 300，边池 100', () => {
    const players: Player[] = [
      createPlayer('A', 100), // All-in 100
      createPlayer('B', 100), // 跟注 100
      createPlayer('C', 200), // 跟注 200
    ]

    const result = calculatePots(players)

    expect(result.totalPot).toBe(400) // 100 + 100 + 200

    // 主池：每人出 100，共 300
    expect(result.pots[0].amount).toBe(300)
    expect(result.pots[0].eligiblePlayerIds).toEqual(['A', 'B', 'C'])

    // 边池：C 额外出的 100，只有 C 有资格
    expect(result.pots[1].amount).toBe(100)
    expect(result.pots[1].eligiblePlayerIds).toEqual(['C'])
  })
})

// ==================== 多人 All-in 边池测试 ====================
describe('Multiple Players All-in (多人 All-in)', () => {
  it('A All-in 50，B All-in 100，C 跟注 150 → 主池 150，边池 100，边池 50', () => {
    const players: Player[] = [
      createPlayer('A', 50),  // All-in 50
      createPlayer('B', 100), // All-in 100
      createPlayer('C', 150), // 跟注 150
    ]

    const result = calculatePots(players)

    expect(result.totalPot).toBe(300) // 50 + 100 + 150

    // 主池：每人出 50，共 150
    expect(result.pots[0].amount).toBe(150)
    expect(result.pots[0].eligiblePlayerIds).toEqual(['A', 'B', 'C'])

    // 第二层：每人额外出 50，共 100（A/B 各出 50，C 出 50）
    expect(result.pots[1].amount).toBe(100)
    expect(result.pots[1].eligiblePlayerIds).toEqual(['B', 'C'])

    // 第三层：C 额外出 50，只有 C 有资格
    expect(result.pots[2].amount).toBe(50)
    expect(result.pots[2].eligiblePlayerIds).toEqual(['C'])
  })

  it('A All-in 30，B All-in 60，C All-in 90，D 跟注 120', () => {
    const players: Player[] = [
      createPlayer('A', 30),
      createPlayer('B', 60),
      createPlayer('C', 90),
      createPlayer('D', 120),
    ]

    const result = calculatePots(players)

    expect(result.totalPot).toBe(300) // 30 + 60 + 90 + 120

    // 主池：每人出 30，共 120
    expect(result.pots[0].amount).toBe(120)
    expect(result.pots[0].eligiblePlayerIds).toEqual(['A', 'B', 'C', 'D'])

    // 第二层：每人额外出 30，共 90
    expect(result.pots[1].amount).toBe(90)
    expect(result.pots[1].eligiblePlayerIds).toEqual(['B', 'C', 'D'])

    // 第三层：C 和 D 各出 30，共 60
    expect(result.pots[2].amount).toBe(60)
    expect(result.pots[2].eligiblePlayerIds).toEqual(['C', 'D'])

    // 第四层：D 额外出 30，只有 D 有资格
    expect(result.pots[3].amount).toBe(30)
    expect(result.pots[3].eligiblePlayerIds).toEqual(['D'])
  })
})

// ==================== 弃牌玩家测试 ====================
describe('Folded Players (弃牌玩家)', () => {
  it('弃牌玩家不应计入底池', () => {
    const players: Player[] = [
      createPlayer('A', 100, true, false), // 活跃
      createPlayer('B', 100, true, true),  // 弃牌 - 不应计入
      createPlayer('C', 100, true, false), // 活跃
    ]

    const result = calculatePots(players)

    expect(result.totalPot).toBe(200) // 只有 A 和 C 的 100
    expect(result.pots[0].eligiblePlayerIds).toEqual(['A', 'C'])
  })

  it('非活跃玩家不应计入底池', () => {
    const players: Player[] = [
      createPlayer('A', 100, true, false),  // 活跃
      createPlayer('B', 100, false, false), // 非活跃 - 不应计入
      createPlayer('C', 100, true, false),  // 活跃
    ]

    const result = calculatePots(players)

    expect(result.totalPot).toBe(200)
    expect(result.pots[0].eligiblePlayerIds).toEqual(['A', 'C'])
  })
})

// ==================== 底池分配测试 ====================
describe('Pot Allocation (底池分配)', () => {
  it('应正确分配底池给单个赢家', () => {
    const pots = [
      { amount: 200, eligiblePlayerIds: ['A', 'B'], isMainPot: true },
      { amount: 100, eligiblePlayerIds: ['B'], isMainPot: false },
    ]

    const winnersByPot = [['A'], ['B']]

    const allocations = allocatePots(pots, winnersByPot)

    expect(allocations.get('A')).toBe(200) // A 赢了主池 200
    expect(allocations.get('B')).toBe(100) // B 赢了边池 100
  })

  it('应正确分配底池给多个赢家（平局）', () => {
    const pots = [
      { amount: 200, eligiblePlayerIds: ['A', 'B'], isMainPot: true },
    ]

    const winnersByPot = [['A', 'B']] // 平局

    const allocations = allocatePots(pots, winnersByPot)

    expect(allocations.get('A')).toBe(100) // 平分 200
    expect(allocations.get('B')).toBe(100)
  })

  it('应正确处理奇数筹码', () => {
    const pots = [
      { amount: 150, eligiblePlayerIds: ['A', 'B', 'C'], isMainPot: true },
    ]

    const winnersByPot = [['A', 'B']] // 两人平分 150

    const allocations = allocatePots(pots, winnersByPot)

    // 150 / 2 = 75每人
    expect(allocations.get('A')).toBe(75)
    expect(allocations.get('B')).toBe(75)
  })

  it('奇数筹码应分配给第一个有资格的玩家', () => {
    const pots = [
      { amount: 100, eligiblePlayerIds: ['A', 'B', 'C'], isMainPot: true },
    ]

    // 三人平分 100，每人 33，余 1
    const winnersByPot = [['A', 'B', 'C']]

    const allocations = allocatePots(pots, winnersByPot)

    expect(allocations.get('A')).toBe(34) // 33 + 1（余数）
    expect(allocations.get('B')).toBe(33)
    expect(allocations.get('C')).toBe(33)
  })
})

// ==================== 边界测试 ====================
describe('Edge Cases (边界情况)', () => {
  it('没有活跃玩家应返回空底池', () => {
    const players: Player[] = [
      createPlayer('A', 100, false, false), // 非活跃
      createPlayer('B', 100, true, true),   // 弃牌
    ]

    const result = calculatePots(players)

    expect(result.totalPot).toBe(0)
    expect(result.pots.length).toBe(0)
  })

  it('单人游戏应返回单人底池', () => {
    const players: Player[] = [
      createPlayer('A', 100),
    ]

    const result = calculatePots(players)

    expect(result.totalPot).toBe(100)
    expect(result.pots.length).toBe(1)
    expect(result.pots[0].amount).toBe(100)
    expect(result.pots[0].eligiblePlayerIds).toEqual(['A'])
  })

  it('所有玩家下注相同金额应只有主池', () => {
    const players: Player[] = [
      createPlayer('A', 100),
      createPlayer('B', 100),
      createPlayer('C', 100),
      createPlayer('D', 100),
    ]

    const result = calculatePots(players)

    expect(result.totalPot).toBe(400)
    expect(result.pots.length).toBe(1) // 只有主池，没有边池
    expect(result.pots[0].isMainPot).toBe(true)
    expect(result.pots[0].amount).toBe(400)
  })
})