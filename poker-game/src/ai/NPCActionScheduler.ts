// ai/NPCActionScheduler.ts — NPC 行动调度器
import type { GameState, Player, PlayerAction } from '@/engine/types'
import type { NPCAgentSkill } from './skills/schema'
import { npcDecisionEngine } from './NPCDecisionEngine'
import { balancedSkill } from './skills/balanced'
import { conservativeSkill } from './skills/conservative'
import { aggressiveSkill } from './skills/aggressive'
import { maniacSkill } from './skills/maniac'

const SKILL_MAP: Record<string, NPCAgentSkill> = {
  conservative: conservativeSkill,
  aggressive: aggressiveSkill,
  balanced: balancedSkill,
  maniac: maniacSkill,
}

// 思考延迟范围（毫秒）
const MIN_THINK_TIME = 800
const MAX_THINK_TIME = 2000

/**
 * NPC 行动调度器
 * 负责 NPC 行动的异步执行，模拟思考延迟
 */
export class NPCActionScheduler {
  private timeoutId: ReturnType<typeof setTimeout> | null = null
  private isProcessing: boolean = false

  /**
   * 调度 NPC 行动
   * @param player NPC 玩家
   * @param gameState 当前游戏状态
   * @param onAction 行动完成回调
   */
  scheduleAction(
    player: Player,
    gameState: GameState,
    onAction: (action: PlayerAction) => void
  ): void {
    if (this.isProcessing || !player.isNPC || player.isFolded || player.isAllIn) {
      return
    }

    this.isProcessing = true

    // 随机思考时间
    const thinkTime = Math.random() * (MAX_THINK_TIME - MIN_THINK_TIME) + MIN_THINK_TIME

    this.timeoutId = setTimeout(async () => {
      try {
        // 获取 NPC 的 Skill
        const skill = player.skillId ? SKILL_MAP[player.skillId] : balancedSkill

        // 决策
        const result = await npcDecisionEngine.decide(player, gameState, skill)

        // 执行行动
        onAction(result.action)
      } catch (error) {
        console.error('NPC 决策失败:', error)
        // 决策失败默认弃牌
        onAction({
          type: 'FOLD',
          playerId: player.id,
          timestamp: Date.now(),
        })
      } finally {
        this.isProcessing = false
        this.timeoutId = null
      }
    }, thinkTime)
  }

  /**
   * 取消调度
   */
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    this.isProcessing = false
  }

  /**
   * 是否正在处理
   */
  get processing(): boolean {
    return this.isProcessing
  }
}

// 导出单例
export const npcActionScheduler = new NPCActionScheduler()