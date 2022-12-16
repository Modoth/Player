export const downloadDataUrl = (url, fileName = 'download.ico') => {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
}
