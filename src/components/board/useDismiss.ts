import { useEffect, type RefObject } from 'react'

/**
 * Close a popover on Escape or on a click outside it.
 *
 * Shared by the filter bar's two dropdowns and the per-post ⋯ menu. `pointerdown`
 * rather than `click` so the menu is gone before a click lands on whatever is
 * underneath, and capture phase so a stopPropagation inside the popover cannot
 * strand it open.
 */
export function useDismiss(open: boolean, close: () => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close, ref])
}
