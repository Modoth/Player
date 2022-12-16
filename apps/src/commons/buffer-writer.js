export class BufferWriter {
  constructor (buffer) {
    this.dataView = new DataView(buffer)
    this.offset = 0
  }

  writeUint8 (num) {
    this.dataView.setUint8(this.offset, num, true)
    this.offset += 1
  }

  writeUint16 (num) {
    this.dataView.setUint16(this.offset, num, true)
    this.offset += 2
  }

  writeUint32 (num) {
    this.dataView.setUint32(this.offset, num, true)
    this.offset += 4
  }
}
