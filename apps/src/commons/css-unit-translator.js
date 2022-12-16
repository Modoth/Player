// todo: to complte
class CssImage {
  static parseAll (/** @type string */ content) {
    const images = []
    const reg = /(?<type>(repeating-)?(radial|linear)-gradient)\(\s*(?<content>.*?)\s*\)(?=(,\s*(repeating-)?(radial|linear)-gradient)|\s*$)/g
    for (const match of content.matchAll(reg)) {
      switch (match.groups.type) {
        case CssRepeatingRadialGradient.name:
          images.push(CssRepeatingRadialGradient.parse(match.groups.content))
          break
        default:
          throw new Error('Not Support')
        // images.push(new CssImage(match.groups.type, match.groups.content))
      }
    }
    return images
  }

  constructor (type, content) {
    this.type = type
    this.content = content
  }

  toString () {
    return `${this.type}(${this.content})`
  }
}

// class CssRepeatingLinearGradient extends CssImage {
//   static get name() {
//     return 'repeating-linear-gradient'
//   }
//   static parse(content) {
//     const match = content.match(
//       /((?<type>circle|ellipse)(\s*(?<length>\w*))?(\s*at(\s*(?<loc>[^,]*)))\s*,)?\s*(?<stop>.*)\s*$/
//     )
//     if (!match) {
//       throw new Error('Invalid Css')
//     }
//     const { type, length, loc, stop } = match.groups
//     const stops = []
//     const stopReg = /(?<color>rgb[^)]*\)|#[0-9A-Fa-f]+|\w+)\s*(?<pos>[\d.][^,]+)?\s*/g
//     for (const stopMatch of stop.matchAll(stopReg)) {
//       const { color, pos } = stopMatch.groups
//       stops.push({ color, pos })
//     }
//     return new CssRepeatingLinearGradient(content, type, length, loc, stops)
//   }
//   constructor(content, type, length, location, stops) {
//     super(CssRepeatingLinearGradient.name, content)
//     this.type = type
//     this.length = length
//     this.location = location
//     this.stops = stops
//   }
//   toPercentage(imageSize) {
//     if (!imageSize) {
//       return
//     }
//     const sizes = imageSize
//       .split(' ')
//       .map((l) => l.trim())
//       .filter((l) => l)
//       .map((l) => parseFloat(l))
//     if (sizes.length === 0) {
//       throw new Error('Invalid image size')
//     }
//     if (sizes.length === 1) {
//       sizes.push(sizes[0])
//     }
//     const toPercentage = (sizes, values) => {
//       const numberValues = values
//         .split(' ')
//         .map((l) => l.trim())
//         .filter((l) => l)
//         .map((l, i) => parseFloat(l))
//       return [
//         numberValues
//           .map((l, i) => ((l * 100) / sizes[i]).toFixed() + '%')
//           .join(' '),
//         numberValues,
//       ]
//     }
//     if (this.length) {
//       this.length = toPercentage(sizes, this.length)[0]
//     }
//     let rs
//     if (this.location) {
//       const [str, nums] = toPercentage(sizes, this.location)
//       this.location = str
//       if (nums.length == 1) {
//         nums.push(nums[0])
//       }
//       rs = sizes.map((s, i) => s / 2 + Math.abs(s / 2 - nums[i]))
//       // rs = sizes.map((s) => s)
//     } else {
//       rs = sizes.map((s) => s / 2)
//     }
//     if (this.type === 'circle') {
//       rs = [Math.hypot(...rs)]
//     }
//     for (const stop of this.stops) {
//       if (!stop.pos) {
//         continue
//       }
//       stop.pos = toPercentage(rs, stop.pos)[0]
//     }
//   }

//   toString() {
//     return `${CssRepeatingLinearGradient.name}(${this.type || ''}${
//       this.length ? ' ' + this.length : ''
//     }${this.location ? ' at ' + this.location : ''}${
//       this.type || this.length || this.location ? ',' : ''
//     }${
//       this.stops
//         ? this.stops
//             .map(({ color, pos }) => color + (pos ? ' ' + pos : ''))
//             .join(', ')
//         : ''
//     })`
//   }
// }

class CssRepeatingRadialGradient extends CssImage {
  static get name () {
    return 'repeating-radial-gradient'
  }

  static parse (content) {
    const match = content.match(
      /((?<type>circle|ellipse)(\s*(?<length>\w*))?(\s*at(\s*(?<loc>[^,]*)))\s*,)?\s*(?<stop>.*)\s*$/
    )
    if (!match) {
      throw new Error('Invalid Css')
    }
    const { type, length, loc, stop } = match.groups
    const stops = []
    const stopReg = /(?<color>rgb[^)]*\)|#[0-9A-Fa-f]+|\w+)\s*(?<pos>[\d.][^,]+)?\s*/g
    for (const stopMatch of stop.matchAll(stopReg)) {
      const { color, pos } = stopMatch.groups
      stops.push({ color, pos })
    }
    return new CssRepeatingRadialGradient(content, type, length, loc, stops)
  }

  constructor (content, type, length, location, stops) {
    super(CssRepeatingRadialGradient.name, content)
    this.type = type
    this.length = length
    this.location = location
    this.stops = stops
  }

  toPercentage (imageSize) {
    if (!imageSize) {
      return
    }
    const sizes = imageSize
      .split(' ')
      .map((l) => l.trim())
      .filter((l) => l)
      .map((l) => parseFloat(l))
    if (sizes.length === 0) {
      throw new Error('Invalid image size')
    }
    if (sizes.length === 1) {
      sizes.push(sizes[0])
    }
    const toPercentage = (sizes, values) => {
      const numberValues = values
        .split(' ')
        .map((l) => l.trim())
        .filter((l) => l)
        .map((l, i) => parseFloat(l))
      return [
        numberValues
          .map((l, i) => ((l * 100) / sizes[i]).toFixed() + '%')
          .join(' '),
        numberValues
      ]
    }
    if (this.length) {
      this.length = toPercentage(sizes, this.length)[0]
    }
    let rs
    if (this.location) {
      const [str, nums] = toPercentage(sizes, this.location)
      this.location = str
      if (nums.length == 1) {
        nums.push(nums[0])
      }
      rs = sizes.map((s, i) => s / 2 + Math.abs(s / 2 - nums[i]))
    } else {
      rs = sizes.map((s) => s / 2)
    }
    if (this.type === 'circle') {
      rs = [Math.hypot(...rs)]
    }
    for (const stop of this.stops) {
      if (!stop.pos) {
        continue
      }
      stop.pos = toPercentage(rs, stop.pos)[0]
    }
  }

  toString () {
    return `${CssRepeatingRadialGradient.name}(${this.type || ''}${
      this.length ? ' ' + this.length : ''
    }${this.location ? ' at ' + this.location : ''}${
      this.type || this.length || this.location ? ',' : ''
    }${
      this.stops
        ? this.stops
            .map(({ color, pos }) => color + (pos ? ' ' + pos : ''))
            .join(', ')
        : ''
    })`
  }
}

export class CssUnitTranslator {
  translate (/** @type string */ css, ignore = new Set()) {
    const ruleStrs = css
      .split(';')
      .map((r) => r.trim())
      .filter((r) => r)

    const rules = []
    const colors = new Map()
    const getColor = (color, varName) => {
      if (!colors.has(color)) {
        varName = varName || `--color-${colors.size}`
        colors.set(color, [`var(${varName})`, varName])
      }
      return colors.get(color)[0]
    }
    for (const ruleStr of ruleStrs) {
      const match = ruleStr.match(/^\s*(.*)\s*:\s*(.*)\s*$/)
      if (!match) {
        throw new Error('Invalid Css')
      }
      const [_, prop, value] = match
      switch (prop) {
        case 'background-image':
          rules.push([prop, ...CssImage.parseAll(value)])
          break
        default:
          rules.push([prop, value])
      }
    }
    const imageSizesP = [...rules]
      .reverse()
      .find((r) => r[0] === 'background-size')
    if (!imageSizesP) {
      console.log('No image size, ignore', css)
      return css
    }
    const imageSizes = imageSizesP.slice(1)
    for (const rule of rules) {
      const [prop, ...values] = rule
      switch (prop) {
        case 'background-image':
          for (let i = 0; i < values.length; i++) {
            if (values[i].toPercentage) {
              values[i].toPercentage(
                imageSizes[i] || imageSizes[imageSizes.length - 1]
              )
            }
            if (values[i].stops) {
              for (const stop of values[i].stops) {
                stop.color = getColor(stop.color)
              }
            }
          }
          continue
        case 'background-color':
          for (let i = 1; i < rule.length; i++) {
            rule[i] = getColor(rule[i], '--background')
          }
          continue
        default:
          continue
      }
    }
    css = Array.from(
      colors,
      ([color, [_, varName]]) => `${varName}: ${color};\n`
    ).join('')
    for (const [prop, ...values] of rules) {
      if (ignore.has(prop)) {
        continue
      }
      switch (prop) {
        case 'background-image':
          css +=
            prop + ': ' + values.map((v) => v.toString()).join(', ') + ';\n'
          break
        default:
          css += prop + ': ' + values.join(', ') + ';\n'
      }
    }
    return css
  }
}
