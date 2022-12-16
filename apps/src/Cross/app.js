/**@typedef {{ cross: Boolean, x: number, y: number, word: String, clue: String }} PuzzleDataItem */
/**@typedef {{ data: PuzzleDataItem, author: String, name: String }} PuzzleData */
/**@typedef {{ letter: String, x: number, y: number, across: String, down: String }} PuzzleCell */
/**@typedef {{allCells: PuzzleCell[], cells: PuzzleCell[][], X : number, Y:number , author: String}} Puzzle */

import { ResizeWatcher } from '../commons/resize-watcher.js'
/** @typedef {{ resourcePath:string, name:string }} PuzzleDataInfo */

const PARENT_NAME = '..'
class PuzzleDataReposirory {
  /** @typedef {{resourcePath:string, path:string, name:string, type: string , date: Date}} Item */
  constructor(url = '') {
    this.url = url
  }
  async getAllInfos() {
    let items = await this.getChildren(this.url)
    /** @type { PuzzleDataInfo[] } */
    let infos = items.filter(i => i.type === 'json').map(i => ({ resourcePath: i.resourcePath, name: i.name }))
    infos = infos.sort((i, j) => -this.compareTitle(i.name, j.name))
    return infos
  }

  async get(/** @type { PuzzleDataInfo } */ info) {
    try {
      /** @type { PuzzleData } */
      const puzzle = await (await fetch(info.resourcePath, { mode: 'cors' })).json()
      if (puzzle.data?.length) {
        Object.assign(puzzle, info)
        return puzzle
      }
    } catch {
      //
    }
  }
  /** @returns {Number} */
  compareTitle(/** @type {String} */ left, /** @type {String} */ right) {
    if (!left || !right) {
      return left < right
    }
    const getParts = str => Array.from(str.matchAll(/(\D\D*)|(\d\d*)/gm), i => i[1] !== undefined ? i[1] : parseInt(i[2]))
    const lefts = getParts(left)
    const rights = getParts(right)
    while (true) {
      const i = lefts.shift()
      const j = rights.shift()
      if (i === undefined && j === undefined) {
        return 0
      }
      else if (i === undefined) {
        return -1
      } else if (j === undefined) {
        return 1
      }
      if (i == j) {
        continue
      }
      return i < j
    }
  }
  async getChildren( /** @type string */ path) {
    /** @type { Item[] } */
    let items = []
    try {
      const content = await (await fetch(path, { mode: 'cors' })).text()
      for (let i of content.matchAll(/<a href="(.*?)\/?">(.*?)(\/?)<\/a>(.*?\S)\s\s/g)) {
        let item = { path: i[1], name: i[2], type: '' }
        if (item.path == PARENT_NAME) {
          continue
        }
        if (!i[3]) {
          item.type = item.name.replace(/^.*\./, '').toLowerCase()
          item.name = item.name.replace(/\.[^.]*$/, '')
          item.date = new Date(i[4].trim())
          item.resourcePath = path + item.path
        }
        else {
          item.resourcePath = path + item.path + PATH_SPLIT
        }

        items.push(item)
      }
    } catch (e) {
      items = []
    }
    return items
  }
}

class PuzzleCell {
  constructor(any, r) {
    registerProperties(this, 'input')
    Object.assign(this, any)
    this.readonly = r && Math.random() < r
    if (this.readonly) {
      this.input = this.letter
    }
  }
}
class App {
  constructor() {
    /** @type { Object.<string,HTMLElement> } */
    this.components
    registerProperties(this, 'isSuccess', 'inputs', 'title', 'puzzle', 'currentCell', 'showInput', 'cellSize', 'cellFontSize')
  }

  buildPuzzle(puzzleData, r = this.data.DEFAULT_R) {
    /** @type {PuzzleDataItem[]} */
    const puzzleDataItems = puzzleData.data
    let puzzleGrid = {}
    let maxX = 0
    let maxY = 0
    for (let item of puzzleDataItems) {
      let x = item.x
      let y = item.y
      for (let i = 0; i < item.word.length; i++) {
        const line = puzzleGrid[y] || {}
        puzzleGrid[y] = line
        const cell = line[x] || {}
        line[x] = cell
        if (cell.letter !== undefined && cell.letter !== item.word[i]) {
          return
        }
        cell.letter = item.word[i]
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
        cell.x = x
        cell.y = y
        if (item.across) {
          cell._across = item
          cell.across = item.clue
          x++
        } else {
          cell._down = item
          cell.down = item.clue
          y++
        }
      }
    }
    maxX++
    maxY++
    /** @type {Puzzle} */
    const puzzle = {
      X: maxX, Y: maxY, author: puzzleData.author || '',
      name: puzzleData.name,
      author: puzzleData.author,
      allCells: []
    }
    puzzle.cells = Array.from({ length: maxY }, (_, y) => Array.from({ length: maxX }, (_, x) => {
      const cell = puzzleGrid[y]?.[x] && new PuzzleCell(puzzleGrid[y]?.[x], r)
      if (cell) {
        puzzle.allCells.push(cell)
      }
      return cell
    }))
    if (puzzle.allCells.length < 1) {
      return
    }
    const clearCell = cell => {
      cell.readonly = false
      cell.input = undefined
    }
    clearCell(puzzle.allCells[0])
    clearCell(puzzle.allCells[Math.floor(Math.random() * puzzle.allCells.length)])
    console.log(Array.from({ length: maxY }, (_, y) => Array.from({ length: maxX }, (_, x) => puzzleGrid[y]?.[x]?.letter || '_').join(' ')).join('\n'))
    return puzzle
  }
  async start() {
    /** @type { { toast:(msg:string, timeout:number = 1000)=>Promise<any> } } */
    this.modal_ = this.components.modal.model
    this.title = 'hello'
    new ResizeWatcher(window, 50).register(this.resize.bind(this))
    this.showInput = false
    this.isSuccess = false
    this.inputs = ' ABCDEFGHIGKLMNOPQRSTUVWXYZ'
    this.rep = new PuzzleDataReposirory(this.data.DATA_PATH)
    this.puzzles = await this.rep.getAllInfos()
    this.currentIdx = -1
    const lastPuzzle = this.getItem('lastPuzzle')
    if (lastPuzzle) {
      const idx = this.puzzles.findIndex(i => i.name == lastPuzzle)
      if (~idx) {
        this.currentIdx = idx - 1
      }
    }

    await this.startNext()
  }

  async startNext() {
    this.isSuccess = false
    this.currentCell = undefined
    this.puzzle = undefined
    const puzzle = await this.getNextPuzzle()
    if (!puzzle) {
      this.modal_.toast('No puzzles.', 3000)
      return
    }
    this.startPuzzle(puzzle)
  }

  async getNextPuzzle() {
    this.currentIdx++
    if (this.currentIdx >= this.puzzles.length) {
      this.currentIdx = 0
    }
    const getInfo = () => {
      if (this.data.RANDOM) {
        let idx = Math.floor(Math.random() * this.puzzles.length)
        return [idx, this.puzzles[idx]]
      }
      return [this.currentIdx, this.puzzles[this.currentIdx]]
    }
    let [idx, info] = getInfo()
    while (info) {
      this.modal_.toast(`Loading ${info.name}`)
      const puzzleData = await this.rep.get(info)
      if (puzzleData) {
        const puzzle = this.buildPuzzle(puzzleData)
        if (puzzle) {
          return puzzle
        }
      }
      this.puzzles.splice(idx, 1)
      [idx, info] = getInfo()
    }
  }

  resize() {
    const grid = this.components.grid
    if (!this.puzzle || !grid) {
      return
    }
    const width = Math.floor(grid.clientWidth / this.puzzle.X)
    const height = Math.floor(grid.clientHeight / this.puzzle.Y)
    let cellWidth = Math.min(width, height)
    const fontSizes = Array.from({ length: 40 }, (_, i) => 8 + i)
    const opt = 0.5
    const fontIdx = Math.max(0, fontSizes.findIndex(i => i > cellWidth * opt) - 1)
    this.cellFontSize = fontSizes[fontIdx]
    this.cellSize = Math.floor(this.cellFontSize / opt)
  }

  inputCell(/** @type {String} */ input) {
    this.showInput = false
    if (!this.currentCell || this.currentCell.readonly) {
      return
    }
    this.currentCell.input = input || undefined
    if (this.currentCell.input != this.currentCell.letter) {
      return
    }
    for (let line of this.puzzle.cells) {
      for (let cell of line) {
        if (!cell || cell.readonly) {
          continue
        }
        if (cell.input !== cell.letter) {
          return
        }
      }
    }
    this.isSuccess = true
    this.modal_.toast('Success!', 2000)
  }

  selectCell(/** @type {PuzzleCell} */ cell) {
    if (this.currentCell !== cell) {
      /** @type {PuzzleCell} */
      this.currentCell = cell
      this.showInput = true
      return
    }
    this.showInput = true
  }

  getKey(key) {
    return `--app-${this.data.APP_NAME}--${key}`
  }

  setItem(key, value) {
    /**@type {Storage} */
    const storage = this.storage
    if (storage) {
      storage.setItem(this.getKey(key), value)
    }
  }

  getItem(key) {
    /**@type {Storage} */
    const storage = this.storage
    if (storage) {
      return storage.getItem(this.getKey(key))
    }
  }

  startPuzzle(/** @type {Puzzle} */ puzzle) {
    this.puzzle = puzzle
    this.setItem('lastPuzzle', puzzle.name)
    this.resize()
    this.modal_.toast(`Start ${puzzle.name}！`, 2000)
  }
}
