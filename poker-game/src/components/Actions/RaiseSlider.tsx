// components/Actions/RaiseSlider.tsx — 加注金额滑块
interface RaiseSliderProps {
  minRaise: number
  maxChips: number
  currentBet: number
  currentMaxBet: number
  value: number
  onChange: (value: number) => void
}

export function RaiseSlider({
  minRaise,
  maxChips,
  currentBet,
  currentMaxBet,
  value,
  onChange,
}: RaiseSliderProps) {
  const minRaiseTotal = currentMaxBet + minRaise
  const maxRaiseTotal = currentBet + maxChips

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value))
  }

  const quickAmounts = [
    minRaiseTotal,
    Math.floor((minRaiseTotal + maxRaiseTotal) / 2),
    maxRaiseTotal,
  ]

  return (
    <div className="space-y-3">
      <div className="text-center text-white font-bold text-lg">
        加注到: {value}
      </div>

      <input
        type="range"
        min={minRaiseTotal}
        max={maxRaiseTotal}
        value={value}
        onChange={handleSliderChange}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
      />

      <div className="flex justify-between text-green-400 text-xs">
        <span>最小: {minRaiseTotal}</span>
        <span>最大: {maxRaiseTotal}</span>
      </div>

      <div className="flex gap-2">
        {quickAmounts.map((amount, index) => (
          <button
            key={index}
            onClick={() => onChange(amount)}
            className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${
              value === amount
                ? 'bg-green-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {amount}
          </button>
        ))}
      </div>
    </div>
  )
}