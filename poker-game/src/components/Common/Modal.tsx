// components/Common/Modal.tsx — 通用弹窗
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-green-900 rounded-xl shadow-2xl border border-green-700 max-w-md w-full mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="bg-green-800 px-6 py-4 flex justify-between items-center border-b border-green-700">
          <h2 className="text-white text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}