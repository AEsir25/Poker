// ai/skills/maniac.ts — 疯狂型（极松主动）
import type { NPCAgentSkill } from './schema'

export const maniacSkill: NPCAgentSkill = {
  id: 'maniac',
  name: '疯狂型',
  description: '极度激进风格，频繁加注和诈唬，几乎不弃牌',
  params: {
    aggressiveness: 0.95,
    bluffFrequency: 0.5,
    callThreshold: 0.2,
    raiseMultiplier: 4.0,
    positionAwareness: 0.2,
    tiltResistance: 0.3,
    foldToReraise: 0.1,
  },
}