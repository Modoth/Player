import { assertPara } from '../commons/assert.js'
import { nameof } from '../commons/nameof.js'
import { remainDevide } from '../commons/remain-devide.js'

export class FlexBitmap {
  constructor (width, height, bufferSize = 10) {
    assertPara(width >= 0, nameof({ width }))
    assertPara(height >= 0, nameof({ height }))
    this.bufferSize_ = parseInt(bufferSize)
    assertPara(this.bufferSize_ > 0, nameof({ bufferSize }))
    /** @type [any] */
    this.buffers_ = []
    this.interWidth_ = 0
    this.bufferPerRow_ = 0
    this.width = 0
    this.height = 0
    this.guaranteeSize_(width - 1, height - 1)
  }

  guaranteeSize_ (x, y) {
    if (x < this.width && y < this.height) {
      return
    }
    if (x >= this.width) {
      this.width = x + 1
    }
    if (this.width > this.interWidth_) {
      const bufferPerRow = Math.max(Math.ceil(this.width / this.bufferSize_), 1)
      const newBuffers = []
      for (let j = 0; j < this.height; j++) {
        for (let i = 0; i < this.bufferPerRow_; i++) {
          newBuffers.push(this.buffers_[i + j * this.bufferPerRow_])
        }
        for (let i = this.bufferPerRow_; i < bufferPerRow; i++) {
          newBuffers.push(new Uint32Array(this.bufferSize_))
        }
      }
      this.bufferPerRow_ = bufferPerRow
      this.interWidth_ = bufferPerRow * this.bufferSize_
      this.buffers_ = newBuffers
    }
    if (y >= this.height) {
      const newHeight = y + 1
      this.buffers_.push(
        ...Array.from(
          { length: (newHeight - this.height) * this.bufferPerRow_ },
          () => new Uint32Array(this.bufferSize_)
        )
      )
      this.height = newHeight
    }
  }

  nonEmptyRow_ (scanInverse = false) {
    for (let j = 0; j < this.height; j++) {
      const fixJ = scanInverse ? this.height - 1 - j : j
      for (let k = 0; k < this.bufferPerRow_; k++) {
        const buffer = this.buffers_[k + this.bufferPerRow_ * fixJ]
        for (let i = 0; i < this.bufferSize_; i++) {
          if (buffer[i] & 0xff) {
            return fixJ
          }
        }
      }
    }
  }

  nonEmptyColumn_ (scanInverse = false) {
    for (let k = 0; k < this.bufferPerRow_; k++) {
      const fixK = scanInverse ? this.bufferPerRow_ - 1 - k : k
      for (let i = 0; i < this.bufferSize_; i++) {
        const fixI = scanInverse ? this.bufferSize_ - 1 - i : i
        for (let j = 0; j < this.height; j++) {
          const buffer = this.buffers_[fixK + this.bufferPerRow_ * j]
          if (buffer[fixI] & 0xff) {
            return fixK * this.bufferSize_ + fixI
          }
        }
      }
    }
  }

  getRegion () {
    const top = this.nonEmptyRow_()
    const bottom = this.nonEmptyRow_(true) + 1
    const left = this.nonEmptyColumn_()
    const right = this.nonEmptyColumn_(true) + 1
    return [top, right, bottom, left]
  }

  get (x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return undefined
    }
    const [rowBufferIdx, offset] = remainDevide(x, this.bufferSize_)
    return this.buffers_[y * this.bufferPerRow_ + rowBufferIdx][offset]
  }

  set (x, y, value) {
    this.guaranteeSize_(x, y)
    const [rowBufferIdx, offset] = remainDevide(x, this.bufferSize_)
    this.buffers_[y * this.bufferPerRow_ + rowBufferIdx][offset] = value
  }

  toString () {
    const rows = []
    for (let j = 0; j < this.height; j++) {
      const row = []
      for (let k = 0; k < this.bufferPerRow_; k++) {
        const buffer = this.buffers_[k + this.bufferPerRow_ * j]
        for (let i = 0; i < this.bufferSize_; i++) {
          if (i + k * this.bufferSize_ >= this.width) {
            row.push(''.padStart(8, 'x'))
          } else {
            row.push(buffer[i].toString('16').padStart(8, '0'))
          }
        }
      }
      rows.push(row.join('\t'))
    }
    return rows.join('\n')
  }
}
