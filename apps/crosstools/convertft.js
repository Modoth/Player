#!/usr/bin/env node
const fs = require('fs')
let input = process.argv[2]
if (!input || !input.endsWith(".json")) {
    console.error(`Usage: ${process.argv[1]} <file.json>`)
    process.exit(-1)
}
const main = async (input) => {
    input = await fs.realpathSync(input)
    const ori = require(input)
    let data = []
    let puzzle = {
        data,
        author: ori.editor
    }
    const parseLine = c => {
        const match = c.match(/^(\d\d*)\.\s*(.*)$/)
        if (!match) {
            throw c
        }
        const idx = Number.parseInt(match[1])
        const clue = match[2]
        if (!idx) {
            throw c
        }
        return [idx, clue]
    }
    const across = {}
    for (let i = 0; i < ori.clues.across.length; i++) {
        const [idx, clue] = parseLine(ori.clues.across[i])
        across[idx] = { across: 1, clue, word: ori.answers.across[i] }
    }
    const down = {}
    for (let i = 0; i < ori.clues.down.length; i++) {
        const [idx, clue] = parseLine(ori.clues.down[i])
        down[idx] = { across: 0, clue, word: ori.answers.down[i] }
    }
    for (let y = 0; y < ori.size.rows; y++) {
        for (let x = 0; x < ori.size.cols; x++) {
            const num = ori.gridnums[y * ori.size.cols + x]
            if (!num) {
                continue
            }
            if (across[num]) {
                const obj = Object.assign({}, across[num], { x, y })
                let word = ""
                for (let x2 = x; x2 < ori.size.cols; x2++) {
                    const char = ori.grid[y * ori.size.cols + x2]
                    if (char == ".") {
                        break
                    }
                    word += char
                }
                obj.word = word
                data.push(obj)
            }
            if (down[num]) {
                const obj = Object.assign({}, down[num], { x, y })
                let word = ""
                for (let y2 = y; y2 < ori.size.rows; y2++) {
                    const char = ori.grid[y2 * ori.size.cols + x]
                    if (char == ".") {
                        break
                    }
                    word += char
                }
                obj.word = word
                data.push(obj)
            }
        }
    }
    console.log(JSON.stringify(puzzle))
}
main(input)