// components/Table/CommunityCards.tsx — 公共牌区域
import type { Card as CardType } from '@/engine/types'
import { Card } from '@/components/Cards/Card'
import { CardBack } from '@/components/Cards/CardBack'

interface CommunityCardsProps {
  cards: CardType[]
}

export function CommunityCards({ cards }: CommunityCardsProps) {
  // 始终显示 5 个位置，未发的牌显示牌背
  const displayCards = [...cards]
  while (displayCards.length < 5) {
    displayCards.push(null)
  }

  return (
    <div className="flex gap-2 justify-center items-center">
      {displayCards.map((card, index) => (
        <div key={index} className="transform">
          {card ? (
            <Card card={card} />
          ) : (
            <CardBack />
          )}
        </div>
      ))}
    </div>
  )
}