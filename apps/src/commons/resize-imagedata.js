export const resizeImageData = (/** @type ImageData */ imageData, size) => {
  const newImageData = new ImageData(size, size)
  const mapx = Array.from({ length: imageData.width }, (_, i) =>
    Math.floor((i * size) / imageData.width)
  )
  const mapy = Array.from({ length: imageData.height }, (_, j) =>
    Math.floor((j * size) / imageData.height)
  )
  for (let j = 0; j < imageData.height; j++) {
    for (let i = 0; i < imageData.width; i++) {
      const idx = (i + j * imageData.width) * 4
      const newIdx = (mapx[i] + mapy[j] * size) * 4
      newImageData.data[newIdx] = imageData.data[idx]
      newImageData.data[newIdx + 1] = imageData.data[idx + 1]
      newImageData.data[newIdx + 2] = imageData.data[idx + 2]
      newImageData.data[newIdx + 3] = imageData.data[idx + 3]
    }
  }
  return newImageData
}
