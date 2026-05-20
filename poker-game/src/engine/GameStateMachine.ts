// engine/GameStateMachine.ts — 游戏阶段状态机
import type { GameState, Pot } from './types'
import { GamePhase } from './types'
import { createShuffledDeck, dealCards } from './Deck'
import { allocatePots } from './PotCalculator'
import { compareHands } from './HandEvaluator'

/**
 * 游戏状态机 — 管理阶段转换
 * 
 * 阶段流转：
 * WAITING → PRE_FLOP → FLOP → TURN → RIVER → SHOWDOWN → SETTLE
 */

/**
 * 开始新一手牌：WAITING → PRE_FLOP
 * - 洗牌
 * - 发手牌（每人2张）
 * - 扣盲注
 * - 设置当前行动玩家
 */
export function startNewRound(state: GameState): GameState {
  let deck = createShuffledDeck()

  // 重置玩家状态
  const players = state.players.map((player) => ({
    ...player,
    holeCards: [],
    currentBet: 0,
    totalBetThisHand: 0,
    isFolded: false,
    isAllIn: false,
  }))

  // 发手牌（每人2张）
  for (let i = 0; i < 2; i++) {
    for (const player of players) {
      if (player.isActive) {
        const { card, remainingDeck } = dealCards(deck, 1)
        player.holeCards = [...player.holeCards, card[0]]
        deck = remainingDeck
      }
    }
  }

  // 扣盲注
  const sbIndex = (state.dealerIndex + 1) % players.length
  const bbIndex = (state.dealerIndex + 2) % players.length

  // 小盲
  const sbPlayer = players[sbIndex]
  const sbAmount = Math.min(state.smallBlind, sbPlayer.chips)
  sbPlayer.chips -= sbAmount
  sbPlayer.currentBet = sbAmount
  sbPlayer.totalBetThisHand = sbAmount
  if (sbPlayer.chips === 0) sbPlayer.isAllIn = true

  // 大盲
  const bbPlayer = players[bbIndex]
  const bbAmount = Math.min(state.bigBlind, bbPlayer.chips)
  bbPlayer.chips -= bbAmount
  bbPlayer.currentBet = bbAmount
  bbPlayer.totalBetThisHand = bbAmount
  if (bbPlayer.chips === 0) bbPlayer.isAllIn = true

  // 创建初始底池
  const pots: Pot[] = [{
    amount: sbAmount + bbAmount,
    eligiblePlayerIds: players.filter(p => p.isActive).map(p => p.id),
    isMainPot: true,
  }]

  // 设置当前行动玩家（大盲后一位）
  let currentPlayerIndex = (bbIndex + 1) % players.length
  let attempts = 0
  while (
    (!players[currentPlayerIndex].isActive || players[currentPlayerIndex].isAllIn) &&
    attempts < players.length
  ) {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length
    attempts++
  }

  return {
    ...state,
    phase: GamePhase.PRE_FLOP,
    players,
    communityCards: [],
    deck,
    pots,
    currentPlayerIndex,
    minRaise: state.bigBlind,
    lastRaiseAmount: state.bigBlind,
    round: state.round + 1,
    actionHistory: [],
    lastAction: undefined,
    winner: undefined,
  }
}

/**
 * 推进阶段：PRE_FLOP → FLOP → TURN → RIVER → SHOWDOWN
 */
export function advancePhase(state: GameState): GameState {
  const { phase, deck, players, pots } = state

  switch (phase) {
    case GamePhase.PRE_FLOP: {
      // 翻牌：发3张公共牌
      const { card: flopCards, remainingDeck } = dealCards(deck, 3)
      return resetBettingRound({
        ...state,
        phase: GamePhase.FLOP,
        communityCards: flopCards,
        deck: remainingDeck,
      })
    }

    case GamePhase.FLOP: {
      // 转牌：发1张公共牌
      const { card: turnCard, remainingDeck } = dealCards(deck, 1)
      return resetBettingRound({
        ...state,
        phase: GamePhase.TURN,
        communityCards: [...state.communityCards, ...turnCard],
        deck: remainingDeck,
      })
    }

    case GamePhase.TURN: {
      // 河牌：发1张公共牌
      const { card: riverCard, remainingDeck } = dealCards(deck, 1)
      return resetBettingRound({
        ...state,
        phase: GamePhase.RIVER,
        communityCards: [...state.communityCards, ...riverCard],
        deck: remainingDeck,
      })
    }

    case GamePhase.RIVER: {
      // 摊牌
      return {
        ...state,
        phase: GamePhase.SHOWDOWN,
      }
    }

    default:
      return state
  }
}

/**
 * 重置下注轮
 * - 清零 currentBet
 * - 设置第一个行动玩家
 */
function resetBettingRound(state: GameState): GameState {
  const players = state.players.map(p => ({
    ...p,
    currentBet: 0,
  }))

  // 找到第一个行动玩家（庄家后第一位活跃玩家）
  let currentPlayerIndex = (state.dealerIndex + 1) % players.length
  let attempts = 0
  while (
    (!players[currentPlayerIndex].isActive ||
      players[currentPlayerIndex].isFolded ||
      players[currentPlayerIndex].isAllIn) &&
    attempts < players.length
  ) {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length
    attempts++
  }

  return {
    ...state,
    players,
    currentPlayerIndex,
    minRaise: state.bigBlind,
    lastRaiseAmount: state.bigBlind,
  }
}

/**
 * 结算：SHOWDOWN → SETTLE
 * - 评估手牌
 * - 分配底池
 */
export function settleRound(state: GameState): GameState {
  const { players, communityCards, pots } = state

  // 找出未弃牌的玩家
  const activePlayers = players.filter(p => !p.isFolded && p.isActive)

  if (activePlayers.length === 1) {
    // 只剩一人，直接获胜
    const winner = activePlayers[0]
    const totalPot = pots.reduce((sum, pot) => sum + pot.amount, 0)
    
    const updatedPlayers = players.map(p =>
      p.id === winner.id ? { ...p, chips: p.chips + totalPot } : p
    )

    return {
      ...state,
      phase: GamePhase.SETTLE,
      players: updatedPlayers,
      winner: [winner.id],
    }
  }

  // 多人摊牌：评估手牌
  const playerHands = activePlayers.map(player => ({
    player,
    cards: [...player.holeCards, ...communityCards],
  }))

  const playerCards = new Map(playerHands.map((h) => [h.player.id, h.cards]))
  const winnersByPot = pots.map((pot) => {
    const eligiblePlayerIds = pot.eligiblePlayerIds.filter((playerId) =>
      playerCards.has(playerId)
    )
    const winnerIndexes = compareHands(
      eligiblePlayerIds.map((playerId) => playerCards.get(playerId)!)
    )
    return winnerIndexes.map((index) => eligiblePlayerIds[index])
  })
  const allocations = allocatePots(pots, winnersByPot)
  const winnerIds = Array.from(new Set(winnersByPot.flat()))

  const updatedPlayers = players.map(p => ({
    ...p,
    chips: p.chips + (allocations.get(p.id) || 0),
  }))

  return {
    ...state,
    phase: GamePhase.SETTLE,
    players: updatedPlayers,
    winner: winnerIds,
  }
}

/**
 * 检查是否只剩一名活跃玩家
 */
export function hasOnlyOneActivePlayer(state: GameState): boolean {
  const activePlayers = state.players.filter(
    p => p.isActive && !p.isFolded
  )
  return activePlayers.length === 1
}

/**
 * 检查是否所有人都 All-in 或弃牌
 */
export function isAllPlayersAllInOrFolded(state: GameState): boolean {
  const activePlayers = state.players.filter(
    p => p.isActive && !p.isFolded
  )
  return activePlayers.every(p => p.isAllIn)
}