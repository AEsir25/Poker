// components/Log/ActionLog.tsx — 操作日志面板
import { useGameState } from '@/store/gameStore'

export function ActionLog() {
  const gameState = useGameState()

  if (!gameState) return null

  const { actionHistory } = gameState

  // 获取行动描述
  const getActionDescription = (entry: typeof actionHistory[0]) => {
    const { playerName, action } = entry
    switch (action.type) {
      case 'FOLD':
        return `${playerName} 弃牌`
      case 'CHECK':
        return `${playerName} 过牌`
      case 'CALL':
        return `${playerName} 跟注 ${action.amount || 0}`
      case 'RAISE':
        return `${playerName} 加注到 ${action.amount || 0}`
      case 'ALL_IN':
        return `${playerName} All-in! ${action.amount || 0}`
      default:
        return `${playerName} 行动`
    }
  }

  // 获取行动对应的颜色
  const getActionColor = (type: string) => {
    switch (type) {
      case 'FOLD':
        return 'text-red-400'
      case 'CHECK':
        return 'text-gray-400'
      case 'CALL':
        return 'text-green-400'
      case 'RAISE':
        return 'text-blue-400'
      case 'ALL_IN':
        return 'text-yellow-400'
      default:
        return 'text-white'
    }
  }

  return (
    <div className="bg-black/70 rounded-lg p-4 max-h-48 overflow-y-auto">
      <h3 className="text-white font-bold mb-2 flex items-center gap-2">
        <span>📝</span>
        <span>操作日志</span>
      </h3>
      <div className="space-y-1">
        {actionHistory.length === 0 ? (
          <div className="text-gray-500 text-sm">暂无行动记录</div>
        ) : (
          actionHistory.slice(-10).map((entry, index) => (
            <div
              key={index}
              className="text-sm flex justify-between items-center"
            >
              <span className={getActionColor(entry.action.type)}>
                {getActionDescription(entry)}
              </span>
              <span className="text-yellow-400 text-xs">
                底池: {entry.potAfter}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}