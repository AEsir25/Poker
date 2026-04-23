// components/Cards/CardBack.tsx — 牌背
interface CardBackProps {
  className?: string
}

export function CardBack({ className = '' }: CardBackProps) {
  return (
    <div
      className={`w-12 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-md flex items-center justify-center border-2 border-blue-400 ${className}`}
    >
      {/* 牌背图案 */}
      <div className="w-8 h-10 border-2 border-blue-300 rounded flex items-center justify-center">
        <span className="text-blue-200 text-lg">🂠</span>
      </div>
    </div>
  )
}