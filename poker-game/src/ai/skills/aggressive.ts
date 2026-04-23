// ai/skills/aggressive.ts — 激进型（松主动）
import type { NPCAgentSkill } from './schema'

export const aggressiveSkill: NPCAgentSkill = {
  id: 'aggressive',
  name: '激进型',
  description: '松主动风格，喜欢加注和诈唬，弃牌率低',
  params: {
    aggressiveness: 0.8,
    bluffFrequency: 0.3,
    callThreshold: 0.4,
    raiseMultiplier: 3.0,
    positionAwareness: 0.5,
    tiltResistance: 0.6,
    foldToReraise: 0.3,
  },
}