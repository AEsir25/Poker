// components/Lobby/GameSettings.tsx — 游戏设置表单
import { useState } from 'react'
import type { GameSettings as GameSettingsType } from '@/engine/types'
import { MIN_BUY_IN_MULTIPLIER, MAX_BUY_IN_MULTIPLIER, MIN_PLAYER_COUNT, MAX_PLAYER_COUNT } from '@/utils/constants'

interface GameSettingsProps {
  onSubmit: (settings: GameSettingsType) => void
  isLoading: boolean
}

export function GameSettings({ onSubmit, isLoading }: GameSettingsProps) {
  const [playerCount, setPlayerCount] = useState(6)
  const [bigBlind, setBigBlind] = useState(20)
  const [playerName, setPlayerName] = useState('玩家')
  const [buyIn, setBuyIn] = useState(1000)

  const smallBlind = Math.floor(bigBlind / 2)
  const minBuyIn = bigBlind * MIN_BUY_IN_MULTIPLIER
  const maxBuyIn = bigBlind * MAX_BUY_IN_MULTIPLIER

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const settings: GameSettingsType = {
      playerCount,
      bigBlind,
      smallBlind,
      buyIn,
      playerName: playerName.trim() || '玩家',
    }

    onSubmit(settings)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 玩家昵称 */}
      <div>
        <label className="block text-green-200 text-sm font-medium mb-2">
          你的昵称
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full bg-green-900/50 border border-green-600 rounded-lg px-4 py-3 text-white placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="输入昵称"
          maxLength={12}
        />
      </div>

      {/* 玩家人数 */}
      <div>
        <label className="block text-green-200 text-sm font-medium mb-2">
          玩家人数: {playerCount} 人
        </label>
        <input
          type="range"
          min={MIN_PLAYER_COUNT}
          max={MAX_PLAYER_COUNT}
          value={playerCount}
          onChange={(e) => setPlayerCount(Number(e.target.value))}
          className="w-full h-2 bg-green-700 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
        <div className="flex justify-between text-green-400 text-xs mt-1">
          <span>{MIN_PLAYER_COUNT} 人</span>
          <span>{MAX_PLAYER_COUNT} 人</span>
        </div>
      </div>

      {/* 大盲注 */}
      <div>
        <label className="block text-green-200 text-sm font-medium mb-2">
          大盲注: {bigBlind}
        </label>
        <div className="flex gap-2">
          {[10, 20, 50, 100].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setBigBlind(value)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                bigBlind === value
                  ? 'bg-green-500 text-white'
                  : 'bg-green-700/50 text-green-300 hover:bg-green-600/50'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <p className="text-green-400 text-xs mt-1">小盲注: {smallBlind}</p>
      </div>

      {/* 买入筹码 */}
      <div>
        <label className="block text-green-200 text-sm font-medium mb-2">
          买入筹码: {buyIn}
        </label>
        <input
          type="range"
          min={minBuyIn}
          max={maxBuyIn}
          step={bigBlind}
          value={buyIn}
          onChange={(e) => setBuyIn(Number(e.target.value))}
          className="w-full h-2 bg-green-700 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
        <div className="flex justify-between text-green-400 text-xs mt-1">
          <span>{minBuyIn} (最小)</span>
          <span>{maxBuyIn} (最大)</span>
        </div>
      </div>

      {/* 开始游戏按钮 */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '正在启动...' : '开始游戏'}
      </button>
    </form>
  )
}