// components/Table/PlayerSeat.tsx — 玩家座位
import type { Player } from '@/engine/types'
import { CardBack } from '@/components/Cards/CardBack'
import { Card } from '@/components/Cards/Card'

interface PlayerSeatProps {
  player: Player
  isDealer: boolean
  isSmallBlind: boolean
  isBigBlind: boolean
  isCurrentPlayer: boolean
}

export function PlayerSeat({
  player,
  isDealer,
  isSmallBlind,
  isBigBlind,
  isCurrentPlayer,
}: PlayerSeatProps) {
  const { name, chips, holeCards, isNPC, isActive, isFolded, isAllIn } = player

  // 状态标签
  const statusLabel = isFolded
    ? '弃牌'
    : isAllIn
      ? 'ALL IN'
      : null

  return (
    <div
      className={`relative flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
        isCurrentPlayer
          ? 'bg-yellow-500/20 ring-2 ring-yellow-400'
          : isActive
            ? 'bg-green-800/50'
            : 'bg-gray-800/50 opacity-50'
      }`}
    >
      {/* 座位标记 */}
      <div className="absolute -top-2 -right-2 flex gap-1">
        {isDealer && (
          <span className="bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
            D
          </span>
        )}
        {isSmallBlind && (
          <span className="bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            SB
          </span>
        )}
        {isBigBlind && (
          <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            BB
          </span>
        )}
      </div>

      {/* 玩家名称 */}
      <div className="text-white text-sm font-medium mb-1 flex items-center gap-1">
        <span>{name}</span>
        {isNPC && <span className="text-green-400 text-xs">🤖</span>}
      </div>

      {/* 手牌 */}
      <div className="flex gap-1 mb-1">
        {holeCards.length > 0 ? (
          // 如果是 NPC 且游戏未结束，显示牌背
          isNPC && !isFolded ? (
            <>
              <CardBack />
              <CardBack />
            </>
          ) : (
            // 显示手牌正面
            holeCards.map((card, index) => (
              <Card key={index} card={card} />
            ))
          )
        ) : (
          // 无手牌时显示占位
          <>
            <CardBack />
            <CardBack />
          </>
        )}
      </div>

      {/* 筹码 */}
      <div className="text-yellow-400 text-sm font-bold">
        💰 {chips.toLocaleString()}
      </div>

      {/* 状态标签 */}
      {statusLabel && (
        <div
          className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded ${
            isFolded
              ? 'bg-gray-600 text-gray-200'
              : 'bg-red-500 text-white'
          }`}
        >
          {statusLabel}
        </div>
      )}
    </div>
  )
}