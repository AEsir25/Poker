// ai/skills/conservative.ts — 保守型（紧被动）
import type { NPCAgentSkill } from './schema'

export const conservativeSkill: NPCAgentSkill = {
  id: 'conservative',
  name: '保守型',
  description: '紧被动风格，只玩强牌，极少诈唬，高弃牌率',
  params: {
    aggressiveness: 0.2,
    bluffFrequency: 0.05,
    callThreshold: 0.7,
    raiseMultiplier: 1.5,
    positionAwareness: 0.8,
    tiltResistance: 0.9,
    foldToReraise: 0.8,
  },
}