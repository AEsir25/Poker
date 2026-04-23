// engine/types.ts — 所有核心引擎类型定义

export enum Suit {
  Hearts = 'H',
  Diamonds = 'D',
  Clubs = 'C',
  Spades = 'S',
}

export enum Rank {
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13,
  Ace = 14,
}

export interface Card {
  suit: Suit
  rank: Rank
  id: string // 如 "Ah"（黑桃A）、"2d"（方块2）
}

export enum GamePhase {
  WAITING = 'WAITING',
  PRE_FLOP = 'PRE_FLOP',
  FLOP = 'FLOP',
  TURN = 'TURN',
  RIVER = 'RIVER',
  SHOWDOWN = 'SHOWDOWN',
  SETTLE = 'SETTLE',
}

export interface Player {
  id: string
  name: string
  chips: number
  holeCards: Card[]
  isNPC: boolean
  // 三态正交，互不重叠
  isActive: boolean // 本局是否有效（chips=0 被淘汰后为 false）
  isFolded: boolean // 本手是否已弃牌
  isAllIn: boolean // 本手是否已全押
  currentBet: number // 当前街已下注额（每街开始清零）
  totalBetThisHand: number // 本手总下注额（用于边池计算）
  seatIndex: number // 座位号 0-7
  skillId?: string // NPC 的 Skill 配置 ID
}

export interface PlayerAction {
  type: 'FOLD' | 'CHECK' | 'CALL' | 'RAISE' | 'ALL_IN'
  amount?: number // RAISE/ALL_IN 时为实际下注总额（非增量）
  playerId: string
  timestamp: number
}

export interface ActionLogEntry {
  playerId: string
  playerName: string
  action: PlayerAction
  phase: GamePhase
  potAfter: number // 操作完成后底池总额
  thoughtSummary?: string // V1.5+ NPC 思考摘要（MVP 为空）
}

export interface Pot {
  amount: number
  eligiblePlayerIds: string[] // 有资格赢取此池的玩家 ID
  isMainPot: boolean
}

export interface GameState {
  id: string
  phase: GamePhase
  players: Player[]
  communityCards: Card[] // 公共牌，0-5 张
  deck: Card[] // 剩余牌组
  pots: Pot[] // 主池 + 边池列表
  dealerIndex: number // 庄家座位索引
  currentPlayerIndex: number // 当前行动玩家索引
  smallBlind: number
  bigBlind: number
  minRaise: number // 当前最小加注增量
  lastRaiseAmount: number // 上次加注的增量（计算最小加注用）
  round: number // 第几手牌（从 1 开始）
  actionHistory: ActionLogEntry[] // 本手所有操作日志
  lastAction?: ActionLogEntry // 最近一次操作（UI 展示用）
  winner?: string[] // 结算后的赢家 ID 列表
}

export interface GameSettings {
  playerCount: number // 6 | 7 | 8
  bigBlind: number
  smallBlind: number // 通常为 bigBlind / 2
  buyIn: number // 买入筹码数
  playerName: string // 人类玩家昵称
  npcSkillAssignments?: Record<number, string> // 座位号 → skillId
}