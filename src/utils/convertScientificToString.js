export const convertScientificToString = (input) => {
  if (!input.toLowerCase().includes('e')) {
    return input
  }

  const [base, exponentPart] = input.toLowerCase().split('e')
  const exponent = parseInt(exponentPart, 10)

  const [integerPart, decimalPart = ''] = base.split('.')
  const digits = integerPart + decimalPart
  const decimalPlaces = decimalPart.length

  if (exponent >= 0) {
    const zerosToAdd = exponent - decimalPlaces
    if (zerosToAdd < 0) {
      const newPosition = integerPart.length + exponent
      const result = digits.slice(0, newPosition) + '.' + digits.slice(newPosition)

      return result.replace(/\.?0+$/, '')
    } else {
      const result = digits + '0'.repeat(zerosToAdd)

      return result
    }
  } else {
    const zerosToAdd = Math.abs(exponent) - integerPart.length
    if (zerosToAdd >= 0) {
      const result = '0.' + '0'.repeat(zerosToAdd) + digits

      return result.replace(/\.?0+$/, '')
    } else {
      const newPosition = integerPart.length + exponent
      const result = digits.slice(0, newPosition) + '.' + digits.slice(newPosition)

      return result.replace(/\.?0+$/, '')
    }
  }
}
