export const paste = () => {
  const input = document.createElement('textarea')
  input.style.display = 'fixed'
  input.style.left = 0
  input.style.right = 0
  input.contentEditable = true
  document.body.appendChild(input)
  input.focus()
  document.execCommand('paste')
  document.body.removeChild(input)
  return input.innerText
}
