/** @type function(Blob file):Promise<string> */
export const toDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.onerror = reject
    reader.onabort = reject
    reader.readAsDataURL(file)
  })
}
