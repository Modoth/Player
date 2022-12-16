import { generateQrCode } from './qrcode-model.js'

export class QrCodeData {
  constructor (width, height) {
    this.width = width
    this.height = height
    this.data = new Uint8Array(this.width * this.height)
  }
}

export class QrCodeGenerator {
  generate (/** @type string */ content) {
    const model = generateQrCode(content)
    const length = model.getModuleCount()
    const qr = new QrCodeData(length, length)
    const data = qr.data
    for (let i = 0; i < length; i++) {
      for (let j = 0; j < length; j++) {
        data[i + j * length] = model.isDark(i, j) ? 1 : 0
      }
    }
    return qr
  }
}
