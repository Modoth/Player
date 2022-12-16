class App {
  constructor() {
    /** @type { Object.<string,HTMLElement> } */
    this.components
    registerProperties(this, 'showKeyboard', 'inputs', 'query', 'url')
  }

  initData() { }
  start() {
    /** @type { { toast:(msg:string, timeout:number = 1000)=>Promise<any> } } */
    this.modal_ = this.components.modal.model
    this.title = 'hello'
    this.showKeyboard = false
    this.query = ''
    this.url = ''
    this.inputs = [[...'QWERTYUIOP', 'DEL'], [...'ASDFGHJKL', 'RET'], [...'ZXCV', 'SPC', ...'BNM']]
    // this.search()
  }

  click(key) {
    switch (key) {
      case 'RET':
        this.search()
        break;
      case 'DEL':
        this.query = this.query.slice(0, this.query.length - 2)
        break
      case 'SPC':
        this.query += ' '
        break
      default:
        this.query += key.toLowerCase()
    }
  }

  async search() {
    this.showKeyboard = false
    this.url = undefined
    const query = this.query.trim()
    if (!query) { return }
    let content = ''
    try {
      content = await (await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`, { mode: 'cors' })).json()
    } catch {
      content = 'NotFound'
    }
    let html = content.map(w => `<div class="word-item">
    <div class="word">${w.word || ''}<span class="phonetic">${w.phonetic || ''}</span></div>
    <div class="origin">${w.origin || ''}</div>
    <div class="meanings">${!w.meanings ? '' : w.meanings.map(m => `<div class="meaning-item">
    <div class="partOfSpeech">${m.partOfSpeech || ''}</div>
    <div class="definitions">${!m.definitions ? '' : m.definitions.map(d => `<div class="definition-item">
    <div class="definition">${d.definition || ''}</div>
    <div class="example">${d.example || ''}</div>
    </div>`).join('\n')}</div>
    </div>`).join('\n')}</div>
    </div>`).join('\n')
    this.url = html
    // this.url = `data:text/html,${encodeURIComponent(html)}`
  }
}
