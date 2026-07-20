import { createPortal } from 'react-dom'
import HoverButton from './HoverButton'

const CANCEL_HOVER  = ['CANCEL! ^_^', 'NEVERMIND! >O<', 'GO BACK! >W<', 'NOPE! ^O^']
const CANCEL_CLICK  = ['CANCELLING >O<', 'GOING BACK ^_^', 'OK OK >W<', 'NEVER MIND ^O^']
const DELETE_HOVER  = ['DELETE! ^_^', 'GONE! >O<', 'BYE BYE! >W<', 'REMOVE! ^O^']
const DELETE_CLICK  = ['DELETING >O<', 'REMOVING ^_^', 'ALMOST >W<', 'GONE! ^O^']

const BASE_BTN = 'flex-1 min-w-0 overflow-hidden flex items-center justify-center font-body font-semibold px-2 py-3 rounded-lg border-2 border-transparent transition-all duration-300 ease-out'

function ConfirmDialog({
  isOpen,
  message,
  onConfirm,
  onCancel,
  cancelLabel = 'CANCEL',
  confirmLabel = 'DELETE',
  cancelHover = CANCEL_HOVER,
  cancelClick = CANCEL_CLICK,
  confirmHover = DELETE_HOVER,
  confirmClick = DELETE_CLICK,
}) {
  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-brand-black/40 backdrop-blur-sm backdrop-in" />

      <div
        className="relative bg-brand-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col gap-6 page-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-4xl select-none inline-block animate-pop">-_-</span>
          <h2 className="font-heading text-brand-black text-2xl">Are you sure?</h2>
          <p className="font-body text-sm text-brand-black opacity-60 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <HoverButton
            hoverMessages={cancelHover}
            clickMessages={cancelClick}
            onClick={onCancel}
            className={`${BASE_BTN} bg-transparent border-2 border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white`}
          >
            {cancelLabel}
          </HoverButton>
          <HoverButton
            hoverMessages={confirmHover}
            clickMessages={confirmClick}
            onClick={onConfirm}
            className={`${BASE_BTN} bg-brand-gold text-brand-white hover:brightness-110`}
          >
            {confirmLabel}
          </HoverButton>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmDialog
