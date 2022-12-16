/** @type { (file:Blob, type: 'ArrayBuffer' | 'DataURL' | 'Text')=>Promise<any> } */
export const readFile = (file, type = 'ArrayBuffer') => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.onerror = reject
    reader.onabort = reject
    reader['readAs' + type](file)
  })
}
