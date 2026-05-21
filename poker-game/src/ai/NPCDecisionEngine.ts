// ai/NPCDecisionEngine.ts — NPC 决策引擎
import type { Player, GameState, PlayerAction, PlayerActionType } from '@/engine/types'
import type { NPCAgentSkill } from './skills/schema'
import { getHandStrength, calculatePotOdds } from './HandStrength'
import { getAvailableActions } from '@/engine/ActionValidator'

interface DecisionResult {
  action: PlayerAction
  thoughtLog: string // 规则引擎的简单说明
}

interface INPCDecisionEngine {
  decide(
    player: Player,
    gameState: GameState,
    skill: NPCAgentSkill
  ): Promise<DecisionResult>
}

/**
 * 规则引擎决策实现
 */
export class RuleBasedDecisionEngine implements INPCDecisionEngine {
  async decide(
    player: Player,
    gameState: GameState,
    skill: NPCAgentSkill
  ): Promise<DecisionResult> {
    const thoughtLog: string[] = []
    const { phase, communityCards, pots, smallBlind, bigBlind, minRaise } = gameState

    // 1. 计算牌力
    const handStrength = getHandStrength(player.holeCards, communityCards, phase)
    thoughtLog.push(`牌力评估: ${(handStrength * 100).toFixed(0)}%`)

    // 2. 计算底池赔率
    const maxBet = Math.max(...gameState.players.map(p => p.currentBet))
    const callAmount = Math.max(0, maxBet - player.currentBet)
    const totalPot = pots.reduce((sum, p) => sum + p.amount, 0)
    const potOdds = calculatePotOdds(callAmount, totalPot)
    thoughtLog.push(`底池赔率: ${(potOdds * 100).toFixed(0)}%`)

    // 3. 获取可用行动
    const availableActions = getAvailableActions(player, gameState)
    thoughtLog.push(`可用行动: ${availableActions.join(', ')}`)

    // 4. 位置加成（越靠后位置加成越高）
    const positionBonus = this.calculatePositionBonus(player, gameState) * skill.params.positionAwareness
    const adjustedStrength = Math.min(1, handStrength + positionBonus)
    thoughtLog.push(`位置加成后牌力: ${(adjustedStrength * 100).toFixed(0)}%`)

    // 5. 诈唬概率
    const bluffChance = Math.random() < skill.params.bluffFrequency
    if (bluffChance) {
      thoughtLog.push('触发诈唬')
    }

    // 6. 决策逻辑
    const effectiveStrength = bluffChance ? Math.max(adjustedStrength, 0.7) : adjustedStrength
    const isPotOddsGood = potOdds < effectiveStrength

    // 优先判断 All-in
    if (player.chips <= callAmount && callAmount > 0) {
      thoughtLog.push('筹码不足，只能 All-in 或弃牌')
      if (effectiveStrength > skill.params.callThreshold * 0.8) {
        return this.buildAction('ALL_IN', player.id, player.chips + player.currentBet, [...thoughtLog, '决定 All-in'])
      } else {
        return this.buildAction('FOLD', player.id, 0, [...thoughtLog, '决定弃牌'])
      }
    }

    // 判断是否可以弃牌
    if (availableActions.includes('FOLD') && effectiveStrength < skill.params.callThreshold * 0.5 && !bluffChance) {
      return this.buildAction('FOLD', player.id, 0, [...thoughtLog, '牌力不足，决定弃牌'])
    }

    // 判断是否可以加注
    if (availableActions.includes('RAISE') && (effectiveStrength > 0.7 || bluffChance)) {
      const raiseAmount = this.calculateRaiseAmount(player, gameState, skill)
      thoughtLog.push(`加注金额: ${raiseAmount}`)
      return this.buildAction('RAISE', player.id, raiseAmount, [...thoughtLog, '决定加注'])
    }

    // 判断是否可以跟注
    if (availableActions.includes('CALL') && (isPotOddsGood || effectiveStrength > skill.params.callThreshold || bluffChance)) {
      return this.buildAction('CALL', player.id, maxBet, [...thoughtLog, '底池赔率合适，决定跟注'])
    }

    // 判断是否可以过牌
    if (availableActions.includes('CHECK')) {
      return this.buildAction('CHECK', player.id, 0, [...thoughtLog, '决定过牌'])
    }

    //  fallback 到弃牌
    return this.buildAction('FOLD', player.id, 0, [...thoughtLog, '默认弃牌'])
  }

  /**
   * 计算位置加成
   * 位置越靠后（行动顺序越晚），加成越高
   */
  private calculatePositionBonus(player: Player, gameState: GameState): number {
    const { players, currentPlayerIndex } = gameState
    const activePlayers = players.filter(p => p.isActive && !p.isFolded && !p.isAllIn).length
    
    // 位置从 0（最早行动）到 1（最晚行动）
    const position = (activePlayers - currentPlayerIndex) / activePlayers
    return position * 0.2 // 最多加 0.2
  }

  /**
   * 计算加注金额
   */
  private calculateRaiseAmount(
    player: Player,
    gameState: GameState,
    skill: NPCAgentSkill
  ): number {
    const { minRaise, bigBlind } = gameState
    const maxBet = Math.max(...gameState.players.map(p => p.currentBet))
    const totalPot = gameState.pots.reduce((sum, p) => sum + p.amount, 0)
    
    // 基础加注额 = 当前最高注 + minRaise
    const minRaiseTotal = maxBet + minRaise
    
    // 最大加注额 = 玩家全部筹码
    const maxRaiseTotal = player.currentBet + player.chips

    // 基于 skill 的加注倍率
    const raiseMultiplier = skill.params.raiseMultiplier
    const potSizeRaise = totalPot * (raiseMultiplier / 2) // 底池的 0.75x 到 2x

    // 取合理值
    let raiseAmount = Math.max(minRaiseTotal, Math.min(maxRaiseTotal, potSizeRaise))
    
    // 对齐到大盲的整数倍
    raiseAmount = Math.ceil(raiseAmount / bigBlind) * bigBlind

    return raiseAmount
  }

  /**
   * 构建行动对象
   */
  private buildAction(
    type: PlayerActionType,
    playerId: string,
    amount: number,
    thoughtLog: string[]
  ): DecisionResult {
    return {
      action: {
        type,
        amount: type === 'RAISE' || type === 'ALL_IN' ? amount : undefined,
        playerId,
        timestamp: Date.now(),
      },
      thoughtLog: thoughtLog.join(' | '),
    }
  }
}

// 导出单例
export const npcDecisionEngine = new RuleBasedDecisionEngine()