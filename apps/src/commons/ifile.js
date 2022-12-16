'use strict'
class FileBase {
  constructor (_name) {
    this._name = _name
    this.fetchedSize = 0
  }

  async name () {
    return this._name
  }

  async seek (start) {
    if (!start) {
      this.fetchedSize = 0
      return this.fetchedSize
    }
    const size = await this.size()
    this.fetchedSize = Math.min(start, size)
    return this.fetchedSize
  }

  async read (buffSize) {
    const size = await this.size()
    if (this.fetchedSize >= size || buffSize === 0) {
      return [new ArrayBuffer(0), true]
    }
    const buff = await this.getRange(this.fetchedSize, buffSize !== undefined
      ? Math.min(size - this.fetchedSize, buffSize)
      : buffSize)
    this.fetchedSize += buff.byteLength
    return [buff, this.fetchedSize >= size]
  }
}
class WebFile extends FileBase {
  constructor (file) {
    super(file.name)
    this.file = file
    this.waitings = []
    this.reader = new FileReader()
    this.reader.onprogress = (ev) => {
      const loaded = ev.loaded
      const idx = this.waitings.findIndex(w => w.needed > loaded)
      if (idx === 0) {
        return
      }
      const waiteds = this.waitings.splice(0, idx > 0 ? idx : this.waitings.length)
      waiteds.forEach(r => r.resolve())
    }
    this.reader.readAsArrayBuffer(file)
  }

  async getRange (start, buffSize) {
    const needed = buffSize === undefined
      ? this.file.size - start
      : Math.min(start + buffSize)
    const buffer = this.reader.result
    if (buffer && buffer.byteLength >= needed) {
      return buffer.slice(start, needed)
    }
    return new Promise(resolve => {
      const waiting = { resolve, needed }
      const idx = this.waitings.findIndex(w => w.needed > needed)
      if (idx === 0) {
        this.waitings.unshift(waiting)
      } else if (idx < 0) {
        this.waitings.push(waiting)
      } else {
        this.waitings.splice(idx - 1, 0, waiting)
      }
    }).then(() => {
      const buffer = this.reader.result
      return buffer.slice(start, needed)
    })
  }

  async size () {
    return this.file.size
  }
}
class BufferFile extends FileBase {
  constructor (name, buffer) {
    super(name)
    this.buffer = buffer
  }

  async getRange (start, buffSize) {
    return this.buffer.slice(start, buffSize === undefined
      ? this.buffer.byteLength - start
      : Math.min(start + buffSize))
  }

  async size () {
    return this.buffer.byteLength
  }
}
