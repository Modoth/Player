export class ColorPaletteFactory {
  create (colors, selectedColor, onSelect) {
    const root = document.createElement('div')
    root.onclick = () => onSelect && onSelect(null)
    const shadow = root.attachShadow({ mode: 'closed' })
    const palette = document.createElement('div')
    shadow.appendChild(palette)
    palette.classList.add('palette')
    const style = /** @imports css */ './color-palette.css'
    shadow.appendChild(style)
    colors.forEach((c) => {
      const cell = document.createElement('div')
      cell.style.backgroundColor = c
      if (c === selectedColor) {
        cell.classList.add('selected')
      }
      palette.appendChild(cell)
      cell.onclick = (ev) => {
        ev.stopPropagation()
        onSelect && onSelect(c)
      }
    })
    return root
  }
}
