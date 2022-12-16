export const copy = (content) => {
  // let oncopy = (/**@type ClipboardEvent */ e) => {
  //   alert(e.clipboard)
  //   let clipboard = e.clipboardData || window['clipboardData']
  //   clipboard.setData('text', content)
  //   e.preventDefault()
  // }

  // document.addEventListener('copy', oncopy, false)
  // document.execCommand('copy')
  // document.removeEventListener('copy', oncopy, false)
  // resolve()
  const textSpan = document.createElement('span')
  textSpan.innerText = content
  textSpan.style.display = 'fixed'
  textSpan.style.left = 0
  textSpan.style.right = 0
  document.body.appendChild(textSpan)
  const range = document.createRange()
  range.selectNode(textSpan)
  const selection = window.getSelection()
  selection.removeAllRanges()
  selection.addRange(range)
  const res = document.execCommand('copy')
  selection.removeAllRanges()
  document.body.removeChild(textSpan)
  return res
}
