export const assert = (
  /** @type boolean */ condition,
  errorMessage = 'Error'
) => {
  if (!condition) {
    throw new Error(errorMessage)
  }
}

export const assertPara = (/** @type boolean */ condition, paraName = '') => {
  if (!condition) {
    throw new Error(`Invalid Parameter  ${paraName}`)
  }
}
