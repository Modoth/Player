export const remainDevide = (x, y) => {
  const remain = x % y
  return [(x - remain) / y, remain]
}
