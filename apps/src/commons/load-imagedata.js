export const loadImageData = (/** @string */ url) => {
  /** @type Promise<ImageData> */
  const task = new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      resolve(ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight))
    }
    img.onerror = () => reject()
    img.src = url
  })
  return task
}
