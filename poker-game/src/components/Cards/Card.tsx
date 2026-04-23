// components/Cards/Card.tsx — 单张牌（正面）
import type { Card as CardType } from '@/engine/types'
import { getSuitDisplayName, getSuitColor } from '@/engine/Card'

interface CardProps {
  card: CardType
  className?: string
}

export function Card({ card, className = '' }: CardProps) {
  const { rank } = card
  const suitSymbol = getSuitDisplayName(card.suit)
  const color = getSuitColor(card.suit)

  // 获取点数显示
  const rankDisplay = getRankDisplay(rank)

  return (
    <div
      className={`w-12 h-16 bg-white rounded-lg shadow-md flex flex-col justify-between p-1 ${className}`}
    >
      {/* 左上角 */}
      <div className={`text-xs font-bold ${color === 'red' ? 'text-red-600' : 'text-black'}`}>
        <div>{rankDisplay}</div>
        <div>{suitSymbol}</div>
      </div>

      {/* 中央花色 */}
      <div className={`text-xl text-center ${color === 'red' ? 'text-red-600' : 'text-black'}`}>
        {suitSymbol}
      </div>

      {/* 右下角（旋转） */}
      <div className={`text-xs font-bold self-end rotate-180 ${color === 'red' ? 'text-red-600' : 'text-black'}`}>
        <div>{rankDisplay}</div>
        <div>{suitSymbol}</div>
      </div>
    </div>
  )
}

function getRankDisplay(rank: number): string {
  switch (rank) {
    case 14:
      return 'A'
    case 13:
      return 'K'
    case 12:
      return 'Q'
    case 11:
      return 'J'
    default:
      return rank.toString()
  }
}