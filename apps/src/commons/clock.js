const ClockStatus = {
  Stop: 0,
  Runing: 1,
  Pause: 2
}

export class Clock {
  constructor (tps = 1) {
    this.now_ = -1
    this.interval_ = 0
    this.tps_ = Math.min(1000, tps)
  }

  get now () {
    return this.now_
  }

  onTick_ () {
    this.tick_++
    this.now_ = Date.now - this.start_
    let task = this.tasks_[0]
    while (task && task.raiseTick <= this.tick_) {
      task.resolve()
      this.tasks_.shift()
      task = this.tasks_[0]
    }
  }

  start () {
    this.tick_ = 0
    this.now_ = 0
    this.start_ = Date.now
    this.tasks_ = []
    this.resume()
  }

  pause () {
    clearInterval(this.interval_)
    this.status = ClockStatus.Stop
  }

  resume () {
    this.interval_ = setInterval(this.onTick_.bind(this), 1000 / this.tps_)
    this.status = ClockStatus.Runing
  }

  stop () {
    this.pause()
    this.status = ClockStatus.Stop
  }

  get tick () {
    return this.tick_
  }

  wait (tick = 0) {
    return new Promise((resolve) => {
      const raiseTick = this.tick_ + tick
      const newTask = { raiseTick, resolve }
      const beforeIdx = this.tasks_.findIndex((t) => t.raiseTick > raiseTick)
      if (beforeIdx === -1) {
        this.tasks_.push(newTask)
      } else {
        this.tasks_.splice(beforeIdx - 1, 0, newTask)
      }
    })
  }
}
