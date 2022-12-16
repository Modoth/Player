import { ResizeWatcher } from './resize-watcher.js'
import { registerDragMove } from './register-drag-move.js'

export class DragMoveCanvas {
  constructor (bufferX, bufferY, getRgba, root, ratio) {
    this.bufferX_ = bufferX
    this.bufferY_ = bufferY
    this.getRgba_ = getRgba
    this.root_ = root
    this.ratio_ = ratio
    const backgroundCanvas = document.createElement('canvas')
    this.root_.appendChild(backgroundCanvas)
    this.backgroundCanvas_ = backgroundCanvas
    this.backgroundCanvas_.style.position = 'absolute'
    const canvas = document.createElement('canvas')
    this.root_.appendChild(canvas)
    this.root_.style.overflow = 'hidden'
    this.canvas_ = canvas
    this.updateCanvasSize_()
    new ResizeWatcher(window).register(this.updateCanvasSize_.bind(this))
    this.canvasContext_ = this.canvas_.getContext('2d')
    this.backgroundCanvasContext_ = this.backgroundCanvas_.getContext('2d')
    this.registerCanvasDrag_()
  }

  registerCanvasDrag_ () {
    let start
    let dx = 0
    let dy = 0
    const threshold = 1
    this.canvas_.onclick = (ev) =>
      this.onClick && this.onClick(ev.clientX, ev.clientY)
    registerDragMove(
      document,
      this.canvas_,
      (pos) => (start = pos),
      (pos) => {
        dx = pos.screenX - start.screenX
        dy = pos.screenY - start.screenY
        this.canvas_.style.transform = `translate(${dx - this.offsetX_}px,${
          dy - this.offsetY_
        }px)`
        this.backgroundCanvas_.style.transform = `translate(${
          dx - this.offsetX_
        }px,${dy - this.offsetY_}px)`
      },
      () => {
        if (Math.abs(dx) + Math.abs(dy) > threshold && this.onMoved) {
          this.onMoved(Math.floor(-dx), Math.floor(-dy))
          dx = 0
          dy = 0
        }
      }
    )
  }

  updateCanvasSize_ () {
    this.width = this.root_.clientWidth
    this.height = this.root_.clientHeight
    this.offsetX_ = Math.floor(this.width * this.bufferX_)
    this.offsetY_ = Math.floor(this.height * this.bufferY_)
    this.canvasWidth_ = this.width + 2 * this.offsetX_
    this.canvas_.width = this.canvasWidth_ * this.ratio_
    this.canvasHeight_ = this.height + 2 * this.offsetY_
    this.canvas_.height = this.canvasHeight_ * this.ratio_
    this.canvas_.style.width = this.canvasWidth_
    this.canvas_.style.height = this.canvasHeight_
    this.backgroundCanvas_.width = this.canvas_.width
    this.backgroundCanvas_.style.width = this.canvas_.style.width
    this.backgroundCanvas_.height = this.canvas_.height
    this.backgroundCanvas_.style.height = this.canvas_.style.height
    if (this.onSizeChange) {
      this.onSizeChange(this.width, this.height)
    }
  }

  drawGrid_ ({ x, y, width, height }) {
    this.backgroundCanvasContext_.clearRect(
      0,
      0,
      this.backgroundCanvas_.width,
      this.backgroundCanvas_.height
    )
    this.backgroundCanvasContext_.strokeStyle = '#8884'
    const dx = (this.offsetX_ - x) % width
    const dy = (this.offsetY_ - y) % height
    this.backgroundCanvasContext_.beginPath()

    for (
      let y = dy * this.ratio_;
      y < this.backgroundCanvas_.height;
      y += height * this.ratio_
    ) {
      this.backgroundCanvasContext_.moveTo(0, y)
      this.backgroundCanvasContext_.lineTo(this.backgroundCanvas_.width, y)
    }
    for (
      let x = dx * this.ratio_;
      x < this.backgroundCanvas_.width;
      x += width * this.ratio_
    ) {
      this.backgroundCanvasContext_.moveTo(x, 0)
      this.backgroundCanvasContext_.lineTo(x, this.backgroundCanvas_.height)
    }
    this.backgroundCanvasContext_.stroke()
  }

  redraw (grid) {
    console.log('redraw')
    if (grid) {
      this.drawGrid_(grid)
    }
    this.canvas_.style.transform = `translate(${-this.offsetX_}px,${-this
      .offsetY_}px)`
    this.backgroundCanvas_.style.transform = `translate(${-this
      .offsetX_}px,${-this.offsetY_}px)`
    this.draw(
      -this.offsetX_,
      -this.offsetY_,
      this.canvasWidth_,
      this.canvasHeight_
    )
  }

  draw (x, y, width, height) {
    const px = Math.floor(x * this.ratio_)
    const py = Math.floor(y * this.ratio_)
    const pwidth = Math.floor((x + width) * this.ratio_) - px
    const pheight = Math.floor((y + height) * this.ratio_) - py
    const imgData = new ImageData(pwidth, pheight)
    for (let j = 0; j < pheight; j++) {
      for (let i = 0; i < pwidth; i++) {
        const bits = this.getRgba_(
          Math.floor((px + i) / this.ratio_),
          Math.floor((py + j) / this.ratio_)
        )
        const idx = (i + j * pwidth) * 4
        imgData.data[idx] = bits[0]
        imgData.data[idx + 1] = bits[1]
        imgData.data[idx + 2] = bits[2]
        imgData.data[idx + 3] = bits[3]
      }
    }
    this.canvasContext_.putImageData(
      imgData,
      Math.floor((x + this.offsetX_) * this.ratio_),
      Math.floor((y + this.offsetY_) * this.ratio_)
    )
  }
}
