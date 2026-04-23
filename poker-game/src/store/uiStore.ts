// store/uiStore.ts — UI 状态管理
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface UiStore {
  isNPCThinking: boolean
  showResultModal: boolean
  highlightedCards: string[]
  animatingChips: boolean
  actionLogVisible: boolean

  // Actions
  setIsNPCThinking: (value: boolean) => void
  setShowResultModal: (value: boolean) => void
  setHighlightedCards: (cardIds: string[]) => void
  setAnimatingChips: (value: boolean) => void
  toggleActionLogVisible: () => void
}

export const useUiStore = create<UiStore>()(
  immer((set) => ({
    isNPCThinking: false,
    showResultModal: false,
    highlightedCards: [],
    animatingChips: false,
    actionLogVisible: true,

    setIsNPCThinking: (value) => set((state) => { state.isNPCThinking = value }),
    setShowResultModal: (value) => set((state) => { state.showResultModal = value }),
    setHighlightedCards: (cardIds) => set((state) => { state.highlightedCards = cardIds }),
    setAnimatingChips: (value) => set((state) => { state.animatingChips = value }),
    toggleActionLogVisible: () => set((state) => { state.actionLogVisible = !state.actionLogVisible }),
  }))
)

// 导出便捷 hooks
export const useUiState = () => useUiStore((state) => state)