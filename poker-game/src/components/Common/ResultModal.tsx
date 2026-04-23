// components/Common/ResultModal.tsx — 结算结果弹窗
import { Modal } from './Modal'
import { useGameState, useGameActions } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'

interface ResultModalProps {
  onNextRound: () => void
}

export function ResultModal({ onNextRound }: ResultModalProps) {
  const gameState = useGameState()
  const { showResultModal, setShowResultModal } = useUiStore()

  if (!gameState || !gameState.winner || gameState.winner.length === 0) {
    return null
  }

  const winnerNames = gameState.winner
    .map(id => gameState.players.find(p => p.id === id)?.name)
    .filter(Boolean)
    .join(', ')

  const totalPot = gameState.pots.reduce((sum, p) => sum + p.amount, 0)

  const handleClose = () => {
    setShowResultModal(false)
  }

  const handleNextRound = () => {
    setShowResultModal(false)
    onNextRound()
  }

  // 检查是否有玩家被淘汰
  const eliminatedPlayers = gameState.players.filter(p => p.chips === 0 && !p.isActive)
  const isGameOver = gameState.players.filter(p => p.isActive).length <= 1

  return (
    <Modal
      isOpen={showResultModal}
      onClose={handleClose}
      title={isGameOver ? "游戏结束" : "本轮结算"}
    >
      <div className="space-y-4">
        {/* 赢家信息 */}
        <div className="text-center">
          <div className="text-yellow-400 text-2xl font-bold mb-2">
            🏆 {winnerNames} 获胜
          </div>
          <div className="text-white text-lg">
            赢得底池: <span className="text-yellow-300">{totalPot}</span> 筹码
          </div>
        </div>

        {/* 玩家筹码变化 */}
        <div className="bg-black/30 rounded-lg p-4 space-y-2">
          <div className="text-white font-medium mb-2">玩家筹码:</div>
          {gameState.players.map(player => (
            <div
              key={player.id}
              className="flex justify-between items-center text-sm"
            >
              <span className={player.isNPC ? 'text-green-300' : 'text-white'}>
                {player.name} {player.isNPC && '🤖'}
              </span>
              <span className={`font-bold ${
                gameState.winner?.includes(player.id) ? 'text-green-400' : 'text-white'
              }`}>
                {player.chips.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* 淘汰提示 */}
        {eliminatedPlayers.length > 0 && (
          <div className="text-red-400 text-sm text-center">
            {eliminatedPlayers.map(p => p.name).join(', ')} 已被淘汰
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-2">
          {isGameOver ? (
            <button
              onClick={handleClose}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              返回大厅
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                关闭
              </button>
              <button
                onClick={handleNextRound}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                下一手
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}