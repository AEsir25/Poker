// components/Table/PokerTable.tsx — 椭圆牌桌主容器
import type { GameState } from '@/engine/types'
import { PlayerSeat } from './PlayerSeat'
import { CommunityCards } from './CommunityCards'
import { PotDisplay } from './PotDisplay'

interface PokerTableProps {
  gameState: GameState
  currentPlayerId?: string // 人类玩家 ID
}

/**
 * 计算玩家座位位置（椭圆布局）
 * 8人桌：玩家固定在底部中央（位置 0），其他玩家按顺序环绕
 */
function getSeatPosition(seatIndex: number, totalPlayers: number) {
  // 玩家（人类）固定在底部中央，对应位置 0
  // 其他玩家按顺时针排列

  // 椭圆参数
  const radiusX = 280 // 水平半径
  const radiusY = 180 // 垂直半径
  const centerX = 400 // 中心 X
  const centerY = 300 // 中心 Y

  // 计算角度（从底部开始，顺时针）
  // 玩家在底部中央（角度 = 90°）
  const angle = (seatIndex / totalPlayers) * 2 * Math.PI + Math.PI / 2

  const x = centerX + radiusX * Math.cos(angle)
  const y = centerY + radiusY * Math.sin(angle)

  return { x, y }
}

export function PokerTable({ gameState, currentPlayerId }: PokerTableProps) {
  const { players, communityCards, pots, dealerIndex } = gameState

  return (
    <div className="relative w-[800px] h-[600px] mx-auto">
      {/* 牌桌椭圆背景 */}
      <div
        className="absolute inset-0 rounded-[50%] border-8 border-amber-900 shadow-2xl"
        style={{
          background: 'radial-gradient(ellipse at center, #166534 0%, #14532d 50%, #052e16 100%)',
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.3)',
        }}
      />

      {/* 公共牌区域 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <CommunityCards cards={communityCards} />
      </div>

      {/* 底池显示 */}
      <div className="absolute top-[35%] left-1/2 transform -translate-x-1/2">
        <PotDisplay pots={pots} />
      </div>

      {/* 玩家座位 */}
      {players.map((player, index) => {
        const position = getSeatPosition(index, players.length)
        const isDealer = index === dealerIndex
        const isSmallBlind = index === (dealerIndex + 1) % players.length
        const isBigBlind = index === (dealerIndex + 2) % players.length
        const isCurrentPlayer = player.id === currentPlayerId

        return (
          <div
            key={player.id}
            className="absolute"
            style={{
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <PlayerSeat
              player={player}
              isDealer={isDealer}
              isSmallBlind={isSmallBlind}
              isBigBlind={isBigBlind}
              isCurrentPlayer={isCurrentPlayer}
            />
          </div>
        )
      })}
    </div>
  )
}