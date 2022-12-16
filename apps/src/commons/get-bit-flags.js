export const getBitFlags = (i) => {
  if (!i) {
    return []
  }
  const s = i.toString(2)
  return Array.from(s, (v, i) => v === '1' && s.length - i - 1).filter(
    (i) => i !== false
  )
}
