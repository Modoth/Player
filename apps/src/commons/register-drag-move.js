export const registerDragMove = (document, target, start, moving, end) => {
  let isMoving = false
  const getPos = (ev) => {
    if (ev.touches) {
      return ev.touches[0]
    } else {
      return ev
    }
  }
  const dragStart = (ev) => {
    isMoving = true
    start(getPos(ev))
  }
  const dragEnd = () => {
    if (isMoving) {
      end()
    }
    isMoving = false
  }
  const drag = (ev) => {
    if (isMoving) {
      ev.preventDefault()
      moving(getPos(ev))
    }
  }
  target.addEventListener('mousedown', dragStart, false)
  document.addEventListener('mouseup', dragEnd, false)
  document.addEventListener('mousemove', drag, false)
  target.addEventListener('touchstart', dragStart, false)
  document.addEventListener('touchend', dragEnd, false)
  document.addEventListener('touchmove', drag, { passive: false })
}
