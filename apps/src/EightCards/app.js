class App {
  constructor() {
    /** @type { Object.<string,HTMLElement> } */
    this.components
    registerProperties(this, 'players', 'controller', 'totalScore', 'playing', 'autoplay',
    'splayer', 'eplayer', 'nplayer', 'wplayer', 'gridplayers')
  }

  async start() {
    /** @type { { toast:(msg:string, timeout:number = 1000)=>Promise<any> } } */
    this.modal_ = this.components.modal.model
    this.totalScore = 0
    this.controller = new Controller()
    this.players = [
      new FoolPlayer(0),
      new FoolPlayer(-1),
      new FoolPlayer(1),
      this.controller
    ]
    this.gridplayers = []
    this.autoplay = false
    this.players = this.players.shuffle()
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i]
      player.order = i
    }
    this.splayer = this.controller
    this.wplayer = this.players[(this.splayer.order+1)%this.players.length]
    this.nplayer = this.players[(this.splayer.order+2)%this.players.length]
    this.eplayer = this.players[(this.splayer.order+3)%this.players.length]
    this.gridplayers = [
      undefined, this.nplayer, undefined, this.wplayer, undefined, this.eplayer, undefined, this.splayer, undefined
    ]
    await this.play()
  }

  toogleAutoplay(){
    this.autoplay = !this.autoplay
    this.controller.setAutoplay(this.autoplay)
    if(this.autoplay && (!this.game || this.game.gameStatus.finished)){
      this.play()
    }
  }

  async restart(){
    this.totalScore = 0
    await this.play()
  }

  async play(){
    await this.modal_.toast("开始")
    this.playing = true
    this.game = new Game(this.players)
    await this.game.play()
    const winner = this.game.gameStatus.loops[this.game.gameStatus.loops.length - 1].maxTurn.player
    const isWinner = winner == this.controller
    let score = 0
    if (isWinner) {
      score = this.controller.winedCards.size + 1
    } else {
      score = this.controller.winedCards.size - 3
    }
    this.totalScore += score
    this.playing = false
    await this.modal_.toast(`本局得分: ${score}`, 2000)
    if(this.autoplay){
      await this.play()
    }
  }

  send(hidden){
    if(!this.game || this.game.gameStatus.finished){
      return this.play()
    }
    this.controller.send(hidden)
  }
}

class Game {
  constructor(/** @type {Player[]} */ players) {
    this.allPlayers = players
  }
  async play() {
    this.gameStatus = new GameStatus()
    /**@type {Card[]} */
    this.cards = this.gameStatus.allCards.shuffle()
    /**@type {Player[]} */
    this.players = this.allPlayers//.shuffle()
    const cardsPerPlayer = this.cards.length / this.players.length
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i]
      player.wins = []
      player.isCurrent = false
      await player.receiveCards(this.cards.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer), this.gameStatus)
    }
    let startPlayer = 0
    let loopCount = -1
    while (true) {
      if (this.players[startPlayer].cards.length <= 0) {
        break
      }
      loopCount++
      console.log(`----------${loopCount}----------\n`)
      let loop = new GameLoop(this.gameStatus.loops.length)
      this.gameStatus.loops.push(loop)
      let maxTurn = undefined
      for (let i = 0; i < this.players.length; i++) {
        const player = this.players[(i + startPlayer) % this.players.length]
        player.isCurrent = true
        const [cards, hidden] = await player.sendCards(loop)
        if (cards.length <= 0) {
          throw ""
        }
        if (maxTurn !== undefined && maxTurn.cards.length !== cards.length) {
          throw ""
        }
        if (!hidden) {
          const cardValues = new Set(cards.map(c => c.value))
          if (cardValues.size != 1) {
            throw ""
          }
        }
        player.removeCards(cards, hidden)
        const turn = { player, cards }
        loop.turns.push(turn)
        if (maxTurn == undefined) {
          maxTurn = turn
        } else if (!hidden && cards[0].value > maxTurn.cards[0].value) {
          maxTurn = turn
        }
        loop.maxTurn = maxTurn
        if (hidden) {
          console.log(`\tPlayer[${player.id}]: Pass`)
        } else {
          console.log(`\tPlayer[${player.id}]:${cards.map(c => c.type + c.value).join("")}`)
        }
        player.isCurrent = false
      }
      startPlayer = maxTurn.player.order
      maxTurn.player.winCards(maxTurn.cards)
      console.log(`Player[${maxTurn.player.id}] Ahead`)
    }
    const winner = this.gameStatus.loops[this.gameStatus.loops.length - 1].maxTurn.player
    for (let player of this.players) {
      if (winner == player) {
        console.log(`Player[${player.id}]: ${player.winedCards.size + 1}`)
      } else {
        console.log(`Player[${player.id}]: ${player.winedCards.size - 3}`)
      }
    }
    this.gameStatus.finished = true
  }
}

class GameLoop {
  constructor(idx) {
    /**@type {number} */
    this.idx = idx
    /**@type {{player:Player, cards: Card[]}[]} */
    this.turns = []
    /**@type {{player:Player, cards: Card[]}} */
    this.maxTurn
  }
}

class GameStatus {
  constructor() {
    this.finished = false
    /**@type {GameLoop[]} */
    this.loops = []
    this.allCards = Array.from({ length: 7 },
      (_, i) => Array.from(CardTypes, t => new Card(i + 1, t))
    ).concat(
      Array.from({ length: 2 },
        (_, i) => Array.from([CardType.Heart, CardType.Diamond], t => new Card(i + 8, t))
      )
    ).flat()
  }
}

const CardType = {
  Spade: "♠️",
  Heart: "♥️",
  Club: "♣️",
  Diamond: "♦️",
}

const CardTypes = [CardType.Heart, CardType.Spade, CardType.Club, CardType.Diamond]
function shuffle() {
  let i = this.length;
  while (i) {
    let j = Math.floor(Math.random() * i--);
    [this[j], this[i]] = [this[i], this[j]];
  }
  return this
}
Array.prototype.shuffle = shuffle
class Card {
  constructor(value, type) {
    /** @type {number} */
    this.value = value
    /** @type {String} */
    this.type = type
    registerProperties(this, 'isSelected')
  }
}

class Player {
  constructor() {
    /**@type {number} */
    this.id = Player.count || 1
    Player.count = this.id + 1
    this.order = 0
    registerProperties(this, 'cards', 'sendedCards', 'winedCards', 'isCurrent')
    this.winedCards = new Set()
  }
  async receiveCards(/** @type {Card[]} */ cards, /** @type {GameStatus} */ gameStatus) {
    this.cards = cards
    this.winedCards = new Set()
    /** @type {[Card, boolean][]} */
    this.sendedCards = []
    this.gameStatus = gameStatus
    return
  }

  removeCards(/** @type {Card[]} */ cards, /**@type {boolean} */ hidden) {
    const cardSet = new Set(cards)
    this.cards = this.cards.filter(c => !cardSet.has(c))
    this.sendedCards = [...this.sendedCards, ...cards.map(c => [c, hidden])]
  }

  winCards(/** @type {Card[]} */ cards) {
    cards.forEach(c => this.winedCards.add(c))
    this.sendedCards = [...this.sendedCards]
  }

  /**@returns {[Card[], boolean]}  */
  async sendCards(/** @type {GameLoop} */ loop) {
    throw ''
  }
}

class FoolPlayer extends Player {
  constructor(strategy=0) {
    super()
    this._strategy = strategy
  }

  positiveStrategy(){
    if(this._strategy>0){
      return true
    }
    if(this._strategy<0){
      return false
    }
    return Math.random() > 0.5
  }

  async receiveCards(/** @type {Card[]} */ cards, /** @type {GameStatus} */ gameStatus) {
    super.receiveCards(cards, gameStatus)
    this.group()
  }

  group() {
    this.cards = this.cards.sort((i, j) => i.value - j.value)
    let groups = {}
    for (let card of this.cards) {
      groups[card.value] = groups[card.value] || []
      groups[card.value].push(card)
    }
    this.groups = Object.keys(groups).map(g => groups[g]).filter(g => g && g.length)
      .sort((i, j) => i[0].value - j[0].value)
  }

  removeCards(/** @type {Card[]} */ cards, /**@type {boolean} */ hidden) {
    super.removeCards(cards, hidden)
    this.group()
  }

  /**@returns {[Card[], boolean]}  */
  async sendCards(/** @type {GameLoop} */ loop, thinking = true) {
    if(thinking){
      await sleep(Math.floor(Math.random()*1000))
    }
    let positiveStrategy = this.positiveStrategy()
    if (loop.turns.length == 0) {
      return [this.groups[positiveStrategy ? this.groups.length-1: 0], false]
    }
    const count = loop.maxTurn.cards.length
    const groups = this.groups.filter(g => g[0].value > loop.maxTurn.cards[0].value
      && g.length >= count)
    const group = groups[positiveStrategy ? groups.length-1: 0]
    if (group !== undefined) {
      return [group.slice(0, count), false]
    }
    return [this.cards.slice(0, count), true]
  }
}

class Controller extends FoolPlayer {
  constructor(){
    super(-1)
    // registerProperties(this, 'cards', 'sendedCards', 'winedCards', 'isCurrent')
    this.resolveSend
    this.autoplay = false
  }

  async setAutoplay(autoplay){
    this.autoplay = autoplay
    if(this.autoplay && this.resolveSend && this.currentLoop){
      const [selected, hidden] = await super.sendCards(this.currentLoop, false)
      const r =  this.resolveSend
      this.resolveSend = undefined
      r([selected, hidden])
    }
  }
  async receiveCards(/** @type {Card[]} */ cards, /** @type {GameStatus} */ gameStatus) {
    super.receiveCards(cards, gameStatus)
    this.cards = this.cards.sort((i,j)=>i.value-j.value)
    this.cards.forEach(c => c.isSelected = undefined)
  }
  /**@returns {[Card[], boolean]}  */
  async sendCards(/** @type {GameLoop} */ loop) {
    if(this.autoplay){
      return await super.sendCards(loop, false) 
    }
    this.currentLoop = loop
    let idx = this.cards.findIndex(c => c.isSelected)
    if(idx < 0){
      const [selected, _] = await super.sendCards(loop, false)
      selected.forEach(c => c.isSelected = true)
    }
    return new Promise(resolve => this.resolveSend = resolve)
  }

  toggleCard(card){
    if(card.isSelected){
      card.isSelected = undefined
      return
    }
    if(!this.currentLoop){
      card.isSelected = true
      return
    }
    if (this.currentLoop.turns.length){
      if(this.currentLoop.maxTurn.cards.length == 1){
        this.cards.forEach(c => c.isSelected = card === c ? true : undefined)
      }else{
        card.isSelected = !card.isSelected
      }
    }else{
      this.cards.forEach(c => c.isSelected = card.value === c.value ? true : undefined)
    }
  }


  send(hidden=false){
    if(!this.currentLoop){
      return
    }
    const send = (hidden=false)=>{
      const r =  this.resolveSend
      this.resolveSend = undefined
      r([selected, hidden])
    }

    let selected = this.cards.filter(c => c.isSelected)
    if(selected.length <= 0){
      return
    }
    let values = new Set(selected.map(c => c.value))
    if (this.currentLoop.turns.length === 0 && values.size === 1){
      send()
      return
    }
    
    if(selected.length !== this.currentLoop.maxTurn.cards.length){
      return
    }
    hidden = hidden || values.size != 1 || selected[0].value <= this.currentLoop.maxTurn.cards[0].value
    send(hidden)
  }
}