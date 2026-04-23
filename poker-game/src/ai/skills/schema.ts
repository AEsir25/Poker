// ai/skills/schema.ts — NPCAgentSkill 接口定义

export interface NPCSkillParams {
  aggressiveness: number // 激进度 0-1
  bluffFrequency: number // 诈唬频率 0-1
  callThreshold: number // 跟注的最低牌力阈值 0-1
  raiseMultiplier: number // 加注倍率 1.5-4（相对底池）
  positionAwareness: number // 位置敏感度 0-1
  tiltResistance: number // 抗倾斜稳定性 0-1
  foldToReraise: number // 面对再加注的弃牌倾向 0-1
}

export interface NPCAgentSkill {
  id: string
  name: string
  description: string
  params: NPCSkillParams // MVP 使用，V1.5+ 降级为 Fallback

  // V1.5+ Agent 化扩展字段（MVP 可为 undefined）
  agent?: {
    personalityPrompt: string
    backstory: string
    thinkingStyle: string
    memoryConfig: {
      enableEpisodeMemory: boolean
      maxMemoryEntries: number
    }
    fallbackToRules: boolean // LLM 不可用时回退规则引擎
  }
}