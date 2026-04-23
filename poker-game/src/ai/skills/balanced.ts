// ai/skills/balanced.ts — 平衡型
import type { NPCAgentSkill } from './schema'

export const balancedSkill: NPCAgentSkill = {
  id: 'balanced',
  name: '平衡型',
  description: '平衡风格，根据牌力和位置调整策略',
  params: {
    aggressiveness: 0.5,
    bluffFrequency: 0.15,
    callThreshold: 0.55,
    raiseMultiplier: 2.0,
    positionAwareness: 0.7,
    tiltResistance: 0.8,
    foldToReraise: 0.5,
  },
}