export const fitCanvas = async (canvas) => {
  if (canvas.width <= 0) {
    return
  }
  canvas.style.width = ''
  canvas.style.height = ''
  await new Promise((resolve) => setTimeout(resolve, 0))
  if (window.innerHeight > window.innerWidth) {
    const width = parseInt(getComputedStyle(canvas).width)
    const height = (width * canvas.height) / canvas.width
    canvas.style.height = Math.floor(height) + 'px'
  } else {
    const height = parseInt(getComputedStyle(canvas).height)
    const width = (height * canvas.width) / canvas.height
    canvas.style.width = Math.floor(width) + 'px'
  }
}
