// const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout))
class App {
  constructor() {
    /** @type { Object.<string,HTMLElement> } */
    this.components
    registerProperties(this, 'cells', 'ranks', 'finished', 'resolving',
      'allBlocks', 'themes', 'theme',
      'rank', 'showCurrentImage',
      'randImageUrl', 'menus', 'upmenus', 'downmenus',
      ['steps', (newvalue) => this.stepsMenus.name = "步骤: " + newvalue],
      ['currentImage', (newValue) => this.template_.imageBg = newValue])
  }

  start() {
    /** @type { { toast:(msg:string, timeout:number = 1000)=>Promise<any> } } */
    this.template_ = this.components.template.model
    this.modal_ = this.template_.components.modal.model
    this.ranks = this.data.ranks
    this.randImageRoot = this.data.randImageRoot
    this.randImageUrl = ''
    this.themes = ['默认', '数字', '随机']
    this.images = [this.data.defaultImageUrl, '']
    this.currentImage = ''
    this.showCurrentImage = false
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    this.theme = this.themes.find(t => t === params.get('theme')) || this.themes[0]
    this.finished = true
    this.resolving = false
    this.stepsMenus = new MenuItem('')
    this.steps = 0
    this.template_.upmenus = [
      ...this.themes.map(r => new MenuItem(r, () => this.setTheme(r))),
      this.stepsMenus
    ]
    this.template_.downmenus = [
      ...this.ranks.map(r => new MenuItem(' ' + r + ' x ' + r, () => this.restart(r)))
    ]
    this.restart(this.ranks.find(t => t.toString() === params.get('rank')) || this.ranks[0])
  }

  toggleShowCurrentImage() {
    this.showCurrentImage = !this.showCurrentImage
  }

  saveSettings() {
    window.location.hash = new URLSearchParams([['rank', this.rank || ''], ['theme', this.theme || '']]).toString()
  }

  async setTheme(theme) {
    await this.stopResolving()
    this.theme = theme
    this.randImageUrl = ''
    await this.updateTheme()
    this.cells = [...this.cells]
    this.saveSettings()
  }

  async splitImages(url, col, row) {
    if (!url) {
      return [undefined, undefined]
    }
    const task = new Promise((resolve, reject) => {
      const img = document.createElement('img')
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        let cellWidth = img.naturalWidth / col
        let cellHeight = img.naturalHeight / row
        cellWidth = Math.min(cellWidth, cellHeight)
        cellHeight = cellWidth
        const offsetX = (img.naturalWidth - cellWidth * col) / 2
        const offsetY = (img.naturalHeight - cellHeight * row) / 2
        const images = []
        const cellCanvas = document.createElement('canvas');
        const cellCtx = cellCanvas.getContext('2d');
        cellCanvas.width = cellWidth;
        cellCanvas.height = cellHeight;
        for (let y = 0; y < row; y++) {
          const line = []
          images.push(line)
          for (let x = 0; x < col; x++) {
            const cellImage = ctx.getImageData(cellWidth * x + offsetX, cellHeight * y + offsetY, cellWidth, cellHeight)
            cellCtx.putImageData(cellImage, 0, 0);
            line.push(cellCanvas.toDataURL('image/jpeg'))
          }
        }
        cellCanvas.width = cellWidth * col;
        cellCanvas.height = cellHeight * row;
        {
          const cellImage = ctx.getImageData(offsetX, offsetY, cellCanvas.width, cellCanvas.height)
          cellCtx.putImageData(cellImage, 0, 0);
          url = cellCanvas.toDataURL('image/jpeg')
        }
        resolve([url, images])
      }
      img.onerror = () => reject()
      img.src = url
    })
    return task
  }

  async getImagesFromTheme() {
    const idx = this.themes.findIndex(i => i === this.theme)
    const imageUrl = (idx < 0 || idx >= this.images.length) ? await this.getRandomImageUrl() : this.images[idx]
    return await this.splitImages(imageUrl, this.rank, this.rank)
  }

  async getRandomImageUrl() {
    if (!this.randImageUrl) {
      const images = await this.getChildren(this.randImageRoot)
      this.randImageUrl = images.length ?
        images[Math.floor(Math.random() * images.length) % images.length].resourcePath
        : undefined
    }
    return this.randImageUrl
  }

  async getChildren( /** @type string */ path) {
    let items = []
    try {
      const content = await (await fetch(path)).text()
      for (let i of content.matchAll(/<a href="(.*?)\/?">(.*?)(\/?)<\/a>(.*?\S)\s\s/g)) {
        let item = { path: i[1], name: decodeURIComponent(i[1]), type: '' }
        if (item.path == "..") {
          continue
        }
        if (!i[3]) {
          item.type = item.name.replace(/^.*\./, '').toLowerCase()
          item.name = item.name.replace(/\.[^.]*$/, '')
          item.date = new Date(i[4].trim())
          item.resourcePath = path + item.path
        }
        else {
          item.resourcePath = path + item.path + "/"
        }

        items.push(item)
      }
    } catch (e) {
      items = []
    }
    return items
  }

  async updateTheme() {
    const [imageUrl, images] = await this.getImagesFromTheme()
    this.currentImage = imageUrl
    for (let i = 0; i < this.allBlocks.length - 1; i++) {
      const block = this.allBlocks[i]
      block.image = ''
      if (images) {
        let x = i % this.rank
        let y = (i - x) / this.rank
        block.image = images[y][x]
      }
    }
  }

  async toogleResolving() {
    if (this.resolving) {
      await this.stopResolving()
    } else {
      this.startResolving()
    }
  }

  async resolve(map) {
    return await []
  }

  async autoResolve() {
    var map = this.cells.map(line =>
      line.map(c => {
        return c.block.isEmpty ? "" : c.block.id + 1
      }))
    const steps = await this.resolve(map);
    for (let step of steps) {
      if (this.finished || !this.resolving) {
        this.resolvingTask = undefined
        return
      }
      const empty = this.cells[step[0].y][step[0].x]
      const target = this.cells[step[1].y][step[1].x]
      await this.switchAndCheck(empty, target)
      await sleep(50)
    }
  }

  async startResolving() {
    if (this.resolving) {
      return
    }
    if (this.finished) {
      return
    }
    this.resolving = true
    this.resolvingTask = this.autoResolve()
    await this.resolvingTask
  }

  async stopResolving() {
    if (!this.resolving) {
      return
    }
    this.resolving = false
    await this.resolvingTask
  }

  async clickCell(/**@type {Cell} */cell) {
    if (this.finished) {
      return
    }
    if (cell.block.isEmpty) {
      if (this.currentImage) {
        this.toggleShowCurrentImage()
      }
      return
    }
    let empty = this.allBlocks[this.allBlocks.length - 1].cell
    if (cell.x !== empty.x && cell.y !== empty.y) {
      return
    }
    let direction = [
      Math.sign(cell.x - empty.x),
      Math.sign(cell.y - empty.y)
    ]
    let source = empty
    while (source !== cell) {
      let target = this.cells[source.y + direction[1]][source.x + direction[0]]
      await this.switchAndCheck(source, target)
      source = target
    }
  }

  async switchAndCheck(source, target) {
    this.switch(source, target)
    this.steps = this.steps + 1
    if (this.check(source) && this.check(target) && this.checkAll()) {
      this.stopResolving()
      this.finished = true
      await this.modal_.toast("完成")
    }
  }

  switch(source, target) {
    const empty = target.block
    target.block = source.block
    target.block.cell = target
    source.block = empty
    empty.cell = source
  }

  checkAll() {
    for (let line of this.cells) {
      for (let cell of line) {
        if (!this.check(cell)) {
          return false
        }
      }
    }
    return true
  }

  check(/**@type {Cell} */cell) {
    return cell.x === cell.block.originX && cell.y === cell.block.originY
  }

  buildBlocks(width = 0, height = 0) {
    if (this.allBlocks && this.allBlocks.length === height * width) {
      return
    }
    const allBlocks = []
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const block = new Block()
        block.originX = x
        block.originY = y
        block.id = y * height + x
        block.name = (block.id + 1).toString()
        allBlocks.push(block)
      }
    }
    allBlocks[allBlocks.length - 1].isEmpty = true
    this.allBlocks = allBlocks
  }

  buildCells(width = 0, height = 0) {
    const cells = []

    const blocks = [...this.allBlocks]
    for (let y = 0; y < height; y++) {
      const line = []
      cells.push(line)
      for (let x = 0; x < width; x++) {
        const isLast = (x === width - 1) && (y === height - 1)
        const cell = new Cell()
        let block = cell.block
        cell.x = x
        cell.y = y
        if (isLast) {
          block = blocks[blocks.length - 1]
        } else {
          block = blocks.splice(Math.floor(Math.random() * (blocks.length - 1)), 1)[0]
        }
        cell.block = block
        block.cell = cell
        line.push(cell)
      }
    }
    /** @type {Cell[][]} */
    this.cells = this.fixCells(cells, this.allBlocks)
  }

  getSwitchCount(/** @type {Cell[][]} */cells, /** @type {Block[]} */blocks) {
    const allSet = new Set(blocks)
    const findNext = () => blocks.find(b => allSet.has(b))
    let switchesCount = 0
    while (allSet.size > 0) {
      let current = findNext()
      if (!current) {
        break
      }
      let loop = new Set()
      while (!loop.has(current)) {
        loop.add(current)
        allSet.delete(current)
        current = cells[current.originY][current.originX].block
      }
      switchesCount += loop.size - 1
    }
    return switchesCount
  }

  fixCells(/** @type {Cell[][]} */cells, /** @type {Block[]} */blocks) {
    let switchesCount = this.getSwitchCount(cells, blocks)
    if (switchesCount % 2 !== 0) {
      this.switch(cells[0][0], cells[0][1])
    }
    return cells
  }

  async restart(rank) {
    this.rank = rank
    this.steps = 0
    this.saveSettings()
    await this.stopResolving()
    this.showCurrentImage = false
    const width = rank;
    const height = rank;
    this.buildBlocks(width, height)
    await this.updateTheme()
    this.buildCells(width, height)
    this.finished = false
    await this.modal_.toast("开始")
  }
}

class Block {
  constructor() {
    registerProperties(this, 'name', 'image')
    /** @type {Cell} */
    this.cell = undefined
    this.name = ''
    this.image = ''
    this.originX = 0
    this.originY = 0
    this.isEmpty = false
  }
}

class Cell {
  constructor() {
    registerProperties(this, 'block')
    /** @type {Block} */
    this.block = undefined
    this.x = 0
    this.y = 0
  }
}
