// components/Table/PotDisplay.tsx — 底池显示
import type { Pot } from '@/engine/types'

interface PotDisplayProps {
  pots: Pot[]
}

export function PotDisplay({ pots }: PotDisplayProps) {
  const totalPot = pots.reduce((sum, pot) => sum + pot.amount, 0)

  if (pots.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {/* 总底池 */}
      <div className="bg-black/50 px-4 py-2 rounded-lg">
        <span className="text-yellow-400 font-bold text-lg">
          底池: {totalPot.toLocaleString()}
        </span>
      </div>

      {/* 如果有边池，显示各池详情 */}
      {pots.length > 1 && (
        <div className="flex gap-2 text-xs">
          {pots.map((pot, index) => (
            <span
              key={index}
              className={`${pot.isMainPot ? 'text-yellow-400' : 'text-green-400'}`}
            >
              {pot.isMainPot ? '主池' : `边池${index}`}: {pot.amount.toLocaleString()}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}