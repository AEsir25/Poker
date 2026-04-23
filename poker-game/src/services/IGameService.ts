// services/IGameService.ts — 游戏服务抽象接口
import type { GameState, GameSettings, PlayerAction } from '@/engine/types'

export interface IGameService {
  createGame(settings: GameSettings): Promise<GameState>
  joinGame(gameId: string, playerId: string): Promise<GameState> // 联网预留
  leaveGame(gameId: string, playerId: string): Promise<void> // 联网预留
  startRound(): Promise<GameState>
  playerAction(playerId: string, action: PlayerAction): Promise<GameState>
  getGameState(): Promise<GameState>
  onStateChange(callback: (state: GameState) => void): void
  dispose(): void // 清理资源、取消订阅
}