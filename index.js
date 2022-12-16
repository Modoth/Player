'use strict'
/** @typedef {{resourcePath:string, path:string, name:string, type: string , date: Date}} Item */

/** @typedef {'None' | 'Play' | 'Pause' | 'Stop' } PlayStatus */

const PLAYER_EXP = /\/Player\/?$/
const PARENT_NAME = '..'
const PATH_SPLIT = '/'
const ROOT_NAME = 'English'
const SITE_ROOT = window.location.pathname.replace(/index\.html$/, '').replace(PLAYER_EXP, PATH_SPLIT)
const ROOT = SITE_ROOT + ROOT_NAME + PATH_SPLIT
const APP_NAME = 'Player/apps/monoliths/'
const APP_ROOT = SITE_ROOT + APP_NAME

class View {
    constructor(doc) {
        /** @type {Document} */
        this.document = doc
        /** @type {HTMLDivElement} */
        this.current = this.document.querySelector('#current')
        /** @type {HTMLDivElement} */
        this.list = this.document.querySelector('#list')
        /** @type {HTMLDivElement} */
        this.player = this.document.querySelector('#player')
        this.player.onclick = () => {
            this.player.classList.toggle('showAllLrc')
        }
        this.document.querySelector('#btnFun').onclick = () => {
            this.document.body.classList.toggle('fun')
        }
        this.document.querySelector('#btnDict').onclick = () => {
            this.document.body.classList.toggle('showDict')
        }
        this.btnLoop = this.document.querySelector('#btnLoop')
        /** @type {HTMLIFrameElement} */
        this.ifmApp = this.document.querySelector('#ifmApp')
        /** @type {HTMLDivElement} */
        this.playName = this.document.querySelector('#playName')
        /** @type {HTMLDivElement} */
        this.playPgr = this.document.querySelector('#playPgr')
        /** @type {HTMLDivElement} */
        this.playAllLrc = this.document.querySelector('#allLrc')
        /** @type {HTMLDivElement} */
        this.playProgress = this.document.querySelector('#playProgress')
        /** @type {HTMLDivElement} */
        this.playMessage = this.document.querySelector('#playMessage')
        /** @type {HTMLDivElement} */
        this.playNextMessage = this.document.querySelector('#playNextMessage')
        /** @type {HTMLTemplateElement} */
        this.listItemTemplate = this.document.querySelector('#listItemTemplate')
        /** @type {HTMLInputElement} */
        this.btnPlayOrPause = this.document.querySelector('#btnPlayOrPause')
        /** @type {HTMLInputElement} */
        this.btnPre = this.document.querySelector('#btnPre')
        /** @type {HTMLInputElement} */
        this.btnNext = this.document.querySelector('#btnNext')
        /** @type {HTMLAudioElement} */
        this.audio = this.document.querySelector('#audio')
        /** @type {HTMLVideoElement} */
        this.video = this.document.querySelector('#video')
        /** @type {HTMLInputElement} */
        this.btnA = this.document.querySelector('#btnA')
        /** @type {HTMLInputElement} */
        this.btnB = this.document.querySelector('#btnB')
        this.video.onclick = () => {
            this.video.requestFullscreen && this.video.requestFullscreen()
        }
        this.video.onclick = () => {
            this.video.requestFullscreen && this.video.requestFullscreen()
        }
        this.document.querySelector('#btnRefresh').onclick = () => {
            window.location.reload()
        }
        this.btnPreventLock = this.document.querySelector('#btnPreventLock')
        /** @type {() => void} */
        this.onPre = undefined
        /** @type {() => void} */
        this.onNext = undefined
        this.btnPre.onclick = () => {
            this.onPre && this.onPre()
        }
        this.btnNext.onclick = () => {
            this.onNext && this.onNext()
        }
    }

    bindAB(/**@type {Number} */ a, /**@type {Number} */ b, onA, onB) {
        this.btnA.onclick = onA
        this.btnB.onclick = onB
        if (a) {
            this.btnA.classList.add('highlight')
            this.btnB.disabled = false
        } else {
            this.btnA.classList.remove('highlight')
            this.btnB.disabled = true
        }
        if (b) {
            this.btnB.classList.add('highlight')
        } else {
            this.btnB.classList.remove('highlight')
        }
    }

    bindLoop(/** @type {Boolean} */ loop, /** @type {()=>void} */ onChange) {
        if (loop) {
            this.btnLoop.classList.add('highlight')
        } else {
            this.btnLoop.classList.remove('highlight')
        }
        this.btnLoop.onclick = onChange
    }

    async bindApps(/** @type {Item[]} */ apps, /** @type {Item} */ currentApp, /** @type {(Item)=>void} */ onSelect) {
        const appList = document.querySelector('#appList')
        const template = document.querySelector('#appItemTemplate')
        appList.innerHTML = ''
        if (apps.length > 0) {
            for (let i of apps) {
                const wraper = this.document.createElement('div')
                const listitem = template.content.cloneNode(true)
                listitem.querySelector('.app-item').href = i.resourcePath
                listitem.querySelector('.title').innerText = i.name
                // listitem.querySelector('.desc').innerText = i.name
                if (i === currentApp) {
                    listitem.querySelector('.app-item').classList.add('current-app')
                } else {
                    wraper.onclick = () => onSelect(i)
                }
                wraper.append(listitem)
                appList.appendChild(wraper)
            }
        }
        this.ifmApp.src = 'about:blank'
        if (currentApp?.resourcePath) {
            this.ifmApp.src = currentApp?.resourcePath
        }
    }

    getAudioElement() {
        return this.audio
    }
    getVideoElement() {
        return this.video
    }
    bindAllLrc( /** @type LrcItem[] */ lrc) {
        this.playAllLrc.innerText = lrc.map(i => i.content).join('\n\n')
    }
    bindPlayStatus(/** @type PlayStatus */ status, /** @type {() => void} */ onChanging, /** @type {NUmber} */ jumpLength) {
        if (status == 'Play') {
            this.player.classList.add('playging')
        } else {
            this.player.classList.remove('playging')
        }
        if (!jumpLength) {
            this.btnPre.value = '上句'
            this.btnNext.value = '下句'
        } else {
            this.btnPre.value = `-${jumpLength}s`
            this.btnNext.value = `+${jumpLength}s`
        }
        switch (status) {
            case 'Pause':
            case 'Stop':
                this.btnPlayOrPause.value = '播放'
                this.btnPlayOrPause.disabled = false
                this.btnPre.disabled = false
                this.btnNext.disabled = false
                break
            case 'Play':
                this.btnPlayOrPause.value = '暂停'
                this.btnPlayOrPause.disabled = false
                this.btnPre.disabled = false
                this.btnNext.disabled = false
                break
            default:
                this.btnPlayOrPause.value = '播/停'
                this.btnPlayOrPause.disabled = true
                this.btnPre.disabled = true
                this.btnNext.disabled = true
                break
        }
        this.btnPlayOrPause.onclick = () => onChanging()
    }
    bindParents(/** @type {Item[]} */ parent, /** @type {Item => void} */ onSelect) {
        this.current.innerText = parent[parent.length - 1]?.name || ''
    }
    bindChildren(/** @type {Item[]} */ children, /** @type {Item} */ current, /** @type {Item => void} */ onSelect) {
        this.list.innerHTML = ''
        for (let c of children) {
            const listItem = this.listItemTemplate.content.cloneNode(true)
            listItem.querySelector('.name').textContent = c.name
            listItem.querySelector('.type').textContent = c.type
            if (c.date) {
                listItem.querySelector('.date').textContent = c.date.toLocaleDateString()
            }
            if (undefined !== current?.resourcePath && c.resourcePath && current.resourcePath.startsWith(c.resourcePath)) {
                listItem.querySelector('.list-item').classList.add('highlight')
            }
            const wraper = this.document.createElement('div')
            wraper.appendChild(listItem)
            wraper.onclick = () => { onSelect(c) }
            this.list.appendChild(wraper)
        }
    }

    bindPlayInfo(/** @type {Item} */ info, /** @type {String} */ mediaType,) {
        this.player.dataset.type = mediaType
        this.playName.innerText = info.name
    }

    bindPlayProgress(/** @type {Number} */ progress) {
        this.playPgr.style.setProperty('--value', `${Math.floor(progress * 100)}%`)
    }

    bindPlayMessages(/** @type {String} */ message = undefined, /** @type {String} */ nextMessage = undefined) {
        this.playMessage.innerText = message || ''
        this.playNextMessage.innerText = nextMessage || ''
    }

    bindPreventLock(/** @type {Boolean} */ preventLock, /** @type {()=>Void} */ onClick) {
        this.btnPreventLock.onclick = onClick
        if (preventLock) {
            this.btnPreventLock.classList.add('highlight')
        } else {
            this.btnPreventLock.classList.remove('highlight')
        }
    }
}

class Timer {
    constructor( /**@type { () => Void } */ onTick, tick = 2000, delay = 5 * 1000, timeout = 30 * 60 * 1000) {
        this.tick = tick
        this.onTick = onTick
        this.running = false
        this.handle = 0
        this.startTime = 0
        this.timeout = timeout
        this.delay = delay
        let touch = this.touch.bind(this)
        window.addEventListener('mousedown', touch, { capture: true })
        window.addEventListener('mouseup', touch, { capture: true })
        window.addEventListener('mousemove', touch, { capture: true })
        window.addEventListener('touchstart', touch, { capture: true })
        window.addEventListener('touchmove', touch, { capture: true })
        window.addEventListener('touchend', touch, { capture: true })
    }

    touch() {
        this.startTime = Date.now() + this.delay
    }

    start() {
        if (this.running) {
            return
        }
        this.handle = window.setInterval(() => {
            if (Date.now() - this.startTime < 0) {
                return
            }
            this.onTick && this.onTick()
            if (Date.now() - this.startTime > this.timeout) {
                this.stop()
            }
        }, this.tick)
        this.running = true
        this.touch()
    }

    stop() {
        if (!this.running) {
            return
        }
        window.clearInterval(this.handle)
        this.running = false
    }

}

class Player {
    constructor(view) {
        /**@type View */
        this.view = view
        this.audio = this.view.getAudioElement()
        this.video = this.view.getVideoElement()
        this.types = new Map([
            ...['mp3'].map(t => [t, { media: this.audio, subTypes: new Set(['lrc']) }]),
            ...['mp4'].map(t => [t, { media: this.video, subTypes: new Set(['srt', 'vtt']) }])
        ])
        /** @type {PlayStatus} */
        this.status = 'None'
        /** @type {HTMLMediaElement} */
        this.currentMediaElement
        this.jumpLength = 0
        this.defultJumpLength = 15
        this.keepAlive = this.keepAlive.bind(this)
        this.timer = new Timer(this.keepAlive, 15000, 10000)
        this.preventLock = true
        this.togglePreventLock()
        this.singleLoop = true
        this.toggleLoop()
        this.a = undefined
        this.b = undefined
        this.toogleA = this.toogleA.bind(this)
        this.toogleB = this.toogleB.bind(this)
        this.updateAB()
    }

    updateAB() {
        this.view.bindAB(this.a, this.b, this.toogleA, this.toogleB)
    }

    toogleA() {
        if (!this.currentMediaElement) {
            return
        }
        if (this.a !== undefined) {
            this.a = undefined
            this.b = undefined
        } else {
            this.a = this.currentMediaElement.currentTime
        }
        this.updateAB()
    }

    toogleB() {
        if (!this.currentMediaElement || this.a === undefined) {
            return
        }
        if (this.b !== undefined) {
            this.a = undefined
            this.b = undefined
        } else {
            this.b = this.currentMediaElement.currentTime
        }
        this.updateAB()
    }

    toggleLoop() {
        this.singleLoop = !this.singleLoop
        this.view.bindLoop(this.singleLoop, this.toggleLoop.bind(this))
    }

    togglePreventLock() {
        this.preventLock = !this.preventLock
        this.view.bindPreventLock(this.preventLock, this.togglePreventLock.bind(this))
        this.updatePreventLock()
    }

    updatePreventLock() {
        if (this.status == 'Play' && this.preventLock) {
            this.timer.start()
        } else {
            this.timer.stop()
        }
    }

    keepAlive() {
        this.currentMediaElement.pause()
        setTimeout(() => {
            this.currentMediaElement.play()
        }, 0);
    }

    getMediaType(/** @type String */ type) {
        return this.types.get(type)
    }

    supportSubTypes(/** @type String */ subType, /** @type String */ type) {
        if (type) {
            return this.types.get(type)?.subTypes?.has(subType)
        }
        return Array.from(this.types.values()).some(s => s.subTypes.has(subType))
    }

    updateMediaStatus() {
        if (this.status == 'Play') {
            this.currentMediaElement.pause()
        } else {
            this.currentMediaElement.play()
        }
    }

    updateStatus( /** @type {PlayStatus} */ newStatus) {
        this.status = newStatus
        this.updatePreventLock()
        this.view.bindPlayStatus(this.status, this.updateMediaStatus.bind(this), this.SubTitles?.length > 1 ? 0 : (this.jumpLength || this.defultJumpLength))
    }
    /** @typedef {{time:number, timeStr:string, content:string }} LrcItem */
    async getSublrcTitle( /** @type string */ path) {
        /** @type LrcItem[] */
        let items = []
        try {
            var res = await fetch(path)
            if (!res.ok) {
                throw new Error()
            }
            const buffer = await res.arrayBuffer()
            const decoder = new TextDecoder('gb2312')
            const content = decoder.decode(buffer);
            for (let line of content.split('\n')) {
                const match = line.match(/\[(.*)\](.*)/)
                if (match) {
                    const offset = 0
                    const time = offset + match[1].split(':').reverse().reduce((sum, cur, i) => sum + Number(cur) * Math.pow(60, i), 0)
                    if (isNaN(time)) {
                        continue
                    }
                    const item = { time, timeStr: match[1], content: match[2] }
                    items.push(item)
                }
            }
        } catch (e) {
            items = [{ time: 0, content: '请上传字幕' }]
        }
        return items
    }

    /** @typedef {{time:number, timeStr:string, content:string }} LrcItem */
    async getSubsrtTitle( /** @type string */ path) {
        /** @type LrcItem[] */
        let items = []
        try {
            var res = await fetch(path)
            if (!res.ok) {
                throw new Error()
            }
            const buffer = await res.arrayBuffer()
            const decoder = new TextDecoder()
            const txt = decoder.decode(buffer);
            let lastItem = { time: 0, timeStr: '', content: '' }
            items.push(lastItem)
            for (let line of txt.split(/\n\n|\r\n\r\n/)) {
                line = line && line.trim()
                if (!line) {
                    continue
                }
                const sublines = line.split('\n')
                if (sublines.length < 3) {
                    continue
                }
                const content = sublines.slice(2).join('\n').replace(/\{.*\}/g, '').replace(/\<.*\>/g, '')
                const timeStr = sublines[1]
                const matchs = Array.from(timeStr.matchAll(/(\d\d):(\d\d):(\d\d),(\d\d\d)/g))
                const getTime = match => Number(match[1]) * 60 * 60 + Number(match[2]) * 60 + Number(match[3])
                    + Number(match[4]) / Math.pow(10, match[4].length)
                if (matchs[0]) {
                    const time = getTime(matchs[0])
                    if (isNaN(time)) {
                        continue
                    }
                    const item = { time, timeStr, content }
                    if (item.time - lastItem.time < Number.EPSILON) {
                        items[items.length - 1] = item
                    } else {
                        items.push(item)
                    }
                    lastItem = item
                }
                if (matchs[1]) {
                    const time = getTime(matchs[1])
                    if (isNaN(time)) {
                        continue
                    }
                    const item = { time, timeStr, content: '' }
                    items.push(item)
                    lastItem = item
                }
            }
        } catch (e) {
            items = []
        }
        return items
    }

    /** @typedef {{time:number, timeStr:string, content:string }} LrcItem */
    async getSubvttTitle( /** @type string */ path) {
        /** @type LrcItem[] */
        let items = []
        try {
            var res = await fetch(path)
            if (!res.ok) {
                throw new Error()
            }
            const buffer = await res.arrayBuffer()
            const decoder = new TextDecoder()
            const txt = decoder.decode(buffer);
            let lastItem = { time: 0, timeStr: '', content: '' }
            items.push(lastItem)
            for (let line of txt.split(/\n\n|\r\n\r\n/)) {
                line = line && line.trim()
                if (!line) {
                    continue
                }
                const sublines = line.split('\n')
                if (sublines.length < 2) {
                    continue
                }
                const content = sublines.slice(1).join('\n').replace(/\{.*\}/g, '').replace(/\<.*\>/g, '')
                const timeStr = sublines[0]
                const matchs = Array.from(timeStr.matchAll(/(\d\d):(\d\d):(\d\d)\.(\d\d\d)/g))
                const getTime = match => Number(match[1]) * 60 * 60 + Number(match[2]) * 60 + Number(match[3])
                    + Number(match[4]) / Math.pow(10, match[4].length)
                if (matchs[0]) {
                    const time = getTime(matchs[0])
                    if (isNaN(time)) {
                        continue
                    }
                    const item = { time, timeStr, content }
                    if (item.time - lastItem.time < Number.EPSILON) {
                        items[items.length - 1] = item
                    } else {
                        items.push(item)
                    }
                    lastItem = item
                }
                if (matchs[1]) {
                    const time = getTime(matchs[1])
                    if (isNaN(time)) {
                        continue
                    }
                    const item = { time, timeStr, content: '' }
                    items.push(item)
                    lastItem = item
                }
            }
        } catch (e) {
            items = []
        }
        return items
    }

    async play(/** @type {Item} */ info, replay = false, /** @type {(Item) => Void} */ goNext) {
        if (this.info?.resourcePath == info.resourcePath) {
            this.info = info
            if (replay) {
                this.currentMediaElement.currentTime = 0
                this.currentMediaElement.play()
            }
            return
        }
        if (this.currentMediaElement) {
            this.currentMediaElement.onplay = undefined
            this.currentMediaElement.onpause = undefined
            this.currentMediaElement.onended = undefined
            this.currentMediaElement.ontimeupdate = undefined
            this.currentMediaElement.onloadedmetadata = undefined
            this.currentMediaElement.pause()
            this.currentMediaElement.src = undefined
            this.currentMediaElement = undefined
            this.jumpLength = undefined
        }
        this.a = undefined
        this.b = undefined
        this.updateAB()
        if (this.mediaUrl) {
            window.URL.revokeObjectURL(this.mediaUrl)
            this.mediaUrl = undefined
        }
        if (this.info) {
            this.view.bindAllLrc([])
        }
        /** @type {Item | undefined} */
        this.info = undefined
        this.currentMediaElement = this.types.get(info.type)?.media
        if (!this.currentMediaElement) {
            return
        }
        this.info = info
        this.view.bindPlayInfo(info, this.currentMediaElement.nodeName)
        this.updateStatus('None')
        this.view.bindPlayMessages()
        this.view.bindPlayProgress(0)
        if (false) {
            const res = await fetch(this.info.resourcePath)
            if (!res.ok) {
                return
            }
            const buffer = await res.arrayBuffer()
            // const AudioContext = window.AudioContext || window.webkitAudioContext;
            // /**@type {AudioContext} */
            // this.context = new AudioContext()
            // const source = this.context.createBufferSource()
            // source.buffer = buffer
            // source.loop = true
            // source.connect(this.context.destination)
            console.log(new TextDecoder().decode(buffer))
            const blob = new Blob([buffer], { type: res.headers.get('content-type') || "audio/mpeg" });
            this.mediaUrl = window.URL.createObjectURL(blob)
            this.currentMediaElement.src = this.mediaUrl
        } else {
            this.currentMediaElement.src = this.info.resourcePath
        }
        /**@type {Item} */
        const sub = this.info.subMedias && this.info.subMedias[0]
        /**@type {(String)=>Promise<any[]>} */
        let getSub
        let subUrl
        if (sub) {
            getSub = this[`getSub${sub.type || ''}Title`]
            subUrl = sub.resourcePath
        }
        // else if (!this.info.subTypes) {
        //     const subType = Array.from(this.types.get(this.info.type).subTypes.keys())[0]
        //     getSub = this[`getSub${subType || ''}Title`]
        //     subUrl = info.resourcePath.replace(this.info.type, subType)
        // }
        if (getSub) {
            this.SubTitles = await getSub.bind(this)(subUrl)
        }
        else {
            this.SubTitles = []
        }
        this.view.bindAllLrc(this.SubTitles)
        this.currentMediaElement.onplay = () => this.updateStatus('Play')
        this.currentMediaElement.onpause = () => this.updateStatus('Pause')
        this.currentMediaElement.onended = () => {
            this.updateStatus('Stop')
            this.nextLrcIdx = 0
            if (this.singleLoop) {
                this.play(this.info, true, goNext)
            } else {
                goNext(this.info)
            }
        }
        this.currentMediaElement.ontimeupdate = undefined
        this.nextLrcIdx = 0
        const gotoLrcAt = (idx) => {
            let item = this.SubTitles[idx]
            let nextItem = this.SubTitles[idx + 1]
            this.currentMediaElement.currentTime = item.time
            this.view.bindPlayMessages(item.content, nextItem?.content)
            this.nextLrcIdx = Math.min(idx + 1, this.SubTitles.length - 1)
        }
        const gotoLrc = (idx, step) => {
            if (!(this.SubTitles?.length > 1)) {
                this.currentMediaElement.currentTime += step * (this.jumpLength || this.defultJumpLength)
                return
            }
            gotoLrcAt(idx)
        }
        this.view.onPre = () => {
            let preIdx = Math.max(this.nextLrcIdx - 2, 0)
            gotoLrc(preIdx, -1)
        }
        this.view.onNext = () => {
            gotoLrc(this.nextLrcIdx, 1)
        }
        if (this.SubTitles.length) {
            gotoLrcAt(this.nextLrcIdx)
        }
        this.currentMediaElement.ontimeupdate = () => {
            if (this.a !== undefined && this.b !== undefined && this.b <= this.currentMediaElement.currentTime) {
                this.currentMediaElement.currentTime = this.a
                // return
            }
            if (this.jumpLength || this.SubTitles?.length > 1 || !this.currentMediaElement.duration) {
                //console.log('')
            } else {
                let jumps = Array.from({ length: 7 }, (_, i) => 15 * Math.pow(2, i))
                let maxJump = 30;
                this.jumpLength = jumps.find(j => j > this.currentMediaElement.duration / maxJump) || this.defultJumpLength
                this.updateStatus(this.status)
            }
            if (this.currentMediaElement.duration > 0) {
                this.view.bindPlayProgress(this.currentMediaElement.currentTime / this.currentMediaElement.duration)
            }
            if (this.currentMediaElement.currentTime < this.SubTitles[this.nextLrcIdx].time) {
                return
            }
            let nextLrcIdx = this.SubTitles.findIndex((v, i) => i >= this.nextLrcIdx && v.time > this.currentMediaElement.currentTime)
            if (~nextLrcIdx) {
                this.view.bindPlayMessages(this.SubTitles[nextLrcIdx - 1]?.content, this.SubTitles[nextLrcIdx]?.content)
                this.nextLrcIdx = nextLrcIdx
            } else {
                this.view.bindPlayMessages(this.SubTitles[this.SubTitles.length - 1].content)
                this.nextLrcIdx = 0
            }
        }
        this.updateStatus('Pause')
        this.currentMediaElement.play()
    }
}

/** @returns {Number} */
const compareTitle = (/** @type {String} */ left, /** @type {String} */ right) => {
    if (!left || !right) {
        return left < right
    }
    const parseShuzi = (shuzi) => {
        let sum = 0
        let ntmp = -1
        let nmap = new Map(Array.from('零一二三四五六七八九', (c, i) => [c, i]))
        let pmap = new Map([...Array.from('个十百千', (c, i) => [c, i]), ...Array.from('万亿兆', (c, i) => [c, 4 * (i + 1)])])
        let plast = Number.MAX_VALUE
        let cs = Array.from(shuzi.matchAll(/[零一二三四五六七八九]|[^零一二三四五六七八九]/g), i => i[0])
        for (let c of cs) {
            let n = nmap.get(c)
            if (n !== undefined) {
                ntmp = n
                continue
            }
            let p = pmap.get(c)
            if (p === undefined) {
                return -1
            }
            if (p >= plast) {
                sum = (sum || 1) * Math.pow(10, p)
            } else {
                if (~ntmp) {
                    sum += ntmp * Math.pow(10, p)
                } else {
                    return -1
                }
            }
            ntmp = -1
            plast = p
        }
        if (~ntmp) {
            sum += ntmp
        }
        return sum
    }
    const getParts = str => Array.from(str.matchAll(/([^0-9零一二三四五六七八九个十百千万亿]{1,})|(\d{1,})|([零一二三四五六七八九个十百千万亿]{1,})/gm), i => i[1] !== undefined ? i[1] :
        (
            i[2] !== undefined ? parseInt(i[2]) : parseShuzi(i[3])
        ))
    // const getParts = str => Array.from(str.matchAll(/(\D{1,})|(\d{1,})/gm), i => i[1] !== undefined ? i[1] :
    //     parseInt(i[2]))
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

class App {
    /** @type {Item[]} */
    parents = []
    /** @type {Item[]} */
    children = []
    /** @type {Item} */
    current
    constructor(view) {
        /**@type View */
        this.view = view
        /**@type Player */
        this.player = new Player(this.view)
    }
    async getChildren( /** @type string */ path) {
        let items = []
        try {
            const content = await (await fetch(path)).text()
            for (let i of content.matchAll(/<a href="(.*?)\/?">(.*?)(\/?)<\/a>(.*?\S)\s\s/g)) {
                let item = { path: i[1], name: decodeURIComponent(i[1]), type: '' }
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

    async openFolder() {
        this.updateUrl()
        let curPath = ROOT
        if (this.parents.length) {
            curPath += this.parents.map(p => p.path).join(PATH_SPLIT) + PATH_SPLIT
        }
        const children = (await this.getChildren(curPath))
        const folders = []
        const medias = []
        const subMedias = {}
        for (const c of children) {
            if (!c.type) {
                folders.push(c)
                continue
            }
            const mediaType = this.player.getMediaType(c.type)
            if (mediaType) {
                c.subTypes = mediaType.subTypes
                medias.push(c)
                continue
            }
            if (this.player.supportSubTypes(c.type)) {
                subMedias[c.type] = subMedias[c.type] || []
                subMedias[c.type].push(c)
            }
        }
        for (let i = 0; i < medias.length; i++) {
            const media = medias[i]
            media.next = medias[(i + 1) % medias.length]
            const prefix = media.name + '.'
            for (const st of media.subTypes) {
                if (!subMedias[st]) {
                    continue
                }
                for (/** @type {Item} */let s of subMedias[st]) {
                    if ((s.name == media.name) || (s.name && s.name.startsWith(prefix))) {
                        media.subMedias = media.subMedias || []
                        media.subMedias.push(s)
                    }
                }
            }
        }
        this.children = [...(this.parents.length > 0 ? [{ path: PARENT_NAME, name: PARENT_NAME, type: '' }] : []),
        ...folders.sort((i, j) => -compareTitle(i.name, j.name)),
        ...medias.sort((i, j) => -compareTitle(i.name, j.name))]
        this.view.bindParents(this.parents, c => this.selectParentOrChild(c))
        this.updateFolderAndItem()
    }

    updateFolderAndItem() {
        this.view.bindChildren(this.children, this.current, c => this.selectParentOrChild(c))
    }

    async openItem() {
        this.updateUrl()
        this.updateFolderAndItem()
        await this.player.play(this.current, false, this.playNext.bind(this))
    }

    async playNext(/** @type { Item | undefined} */ current, nojump = false) {
        let next = current?.next
        if (!next) {
            next = this.children.find(c => c.resourcePath === current.resourcePath)?.next
        }
        if (next?.type) {
            this.current = next
            this.openItem()
            return
        }
        if (nojump) {
            return
        }
        this.updateFolderByPath(current.resourcePath.replace(/\/[^\/]*$/, '').slice(ROOT.length))
        await this.openFolder()
        await this.playNext(current, true)

    }

    async selectParentOrChild(/** @type { Item | undefined} */ porc = undefined) {
        if (porc?.type) {
            this.current = porc
            await this.openItem()
            return
        }
        if (porc === undefined) {
            this.parents = []
        } else if (porc.path === PARENT_NAME) {
            this.parents.pop()
        } else {
            let idx = this.parents.indexOf(porc)
            if (!idx) {
                this.parents = this.parents.slice(0, idx + 1)
            } else {
                this.parents.push(porc)
            }
        }
        await this.openFolder()
    }

    updateUrl() {
        let path = this.parents.map(p => p.path).join(PATH_SPLIT)
        let current = this.current?.resourcePath
        let params = new URLSearchParams('');
        if (path) {
            params.append('path', path)
        }
        if (current) {
            params.append('current', current)
        }
        const context = params.toString()
        window.location.hash = context
        if (window.localStorage) {
            window.localStorage.setItem('context', context)
        }
    }

    updateFolderByPath(path = '') {
        if (!path) {
            return
        }
        this.parents = path.split('/').filter(s => s).map(p => ({ path: p, name: decodeURIComponent(p), type: '' }))
        this.parents[0].resourcePath = ROOT + this.parents[0].path + PATH_SPLIT
        for (let i = 1; i < this.parents.length; i++) {
            this.parents[i].resourcePath = this.parents[i - 1].resourcePath + this.parents[i].path + PATH_SPLIT
        }
    }


    async loadUrl() {
        let context = window.location.hash.replace(/^#/, '').trim()
        if (!context) {
            if (!window.localStorage) {
                return
            }
            context = window.localStorage.getItem('context')
            if (!context) {
                return
            }
        }
        try {
            let params = new URLSearchParams(context);
            let path = params.get('path')
            let current = params.get('current')
            if (current) {
                this.updateFolderByPath(current.replace(/\/[^\/]*$/, '').slice(ROOT.length))
                await this.openFolder()
                const item = this.children.find(c => c.resourcePath === current)
                if (item) {
                    this.current = item
                    await this.openItem()
                }
            }
            if (path) {
                this.updateFolderByPath(path)
                await this.openFolder()
            }
        } catch (e) {
            console.log(e)
        }
    }

    async start() {
        await this.loadUrl()
        if (!this.parents?.length) {
            await this.selectParentOrChild()
        }
        const apps = (await this.getChildren(APP_ROOT)).filter(a => a.type === 'html' && !a.name.startsWith('_')).sort()
        const initApps = (cur) => this.view.bindApps(
            apps,
            cur,
            (i) => {
                initApps(i)
            }
        )
        initApps(apps[0])
    }
}

window.onload = () => {
    new App(new View(document)).start()
}