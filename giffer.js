const fs       = require('fs')
const moment   = require('moment')
const gif      = require('gifencoder')
const pngfs    = require('png-file-stream')
const request  = require('request')
const gm       = require('gm')

const frameUrlBase = (process.env.url) ? process.env.url : "https://qt.exploratorium.edu/roofcam/Observatory/image.jpg"

module.exports = class Giffer {

  constructor (options) {
    this.period = options.period ? options.period : 5
    this.start = options.start ? options.start : 0
    this.totalFrames = options.totalFrames ? options.totalFrames : 20
    this.width = options.width ? options.width : 320
    this.height = options.height ? options.height: 240
    this.repeat = options.repeat ? options.repeat: 0
    this.delay = options.delay ? options.delay: 200
    this.frameUrlBase = options.url ? options.url : frameUrlBase
    this.frequency = this.calcFrequency()
    this.frame = 0
    this.interval
    this.tmpDir = (process.env.tmpDir) ? process.env.tmpDir : './tmp'
    this.finishDir = (process.env.finishDir) ? process.env.finishDir : './finished'
    this.outputName = this.finishDir+'/animated-'+moment().valueOf()+'.gif'
  }

  init () {
    //  create frames
    var promised = new Promise( (resolve, reject) => {
      var self = this
      this.resolve = resolve
      this.reject = reject
      this.getFrame()
      this.interval = setInterval(function () { self.getFrame() }, this.frequency)
    })

    //  return a promise
    return promised
  }

  handleErr (err) {
    if (typeof(this.interval) == 'Timeout') clearInterval(this.interval)
    console.log(err)
    this.reject(err)
    return err
  }

  calcFrequency () {
    var mome, start, end, span

    if (this.start !== 0) mome = moment(this.start)
    else mome = moment()
    start = moment().valueOf()

    end = mome.add({m: this.period}).valueOf()
    span = end-start

    return span/this.totalFrames
  }

  getFrame () {
    var self, frame, frameUrl, data

    this.frame++
    console.log('Writing frame '+this.frame+' of '+this.totalFrames+' total frames. -- '+this.outputName+'\n')

    frameUrl = this.frameUrlBase + "?t=" + Date.now()
    gm( request(frameUrl) ).resize(this.width).write(
      './tmp/00'+this.frame+'.png',
      (err) => {
        if (err) this.handleErr(err)
        if (this.frame == this.totalFrames) this.finish()
      }
    )
  }

  finish () {
    console.log('Finishing gif -- '+this.outputName+'.\n')

    //  stop making frames
    clearInterval(this.interval)

    //  create gif from frames
    gm(this.tmpDir+'/001.png').size( (err, size) => {
      if (err) this.handleErr(err)
      if (size) this.height = size.height
      this.gif = new gif(this.width, this.height)
      pngfs(this.tmpDir+'/*.png')
        .pipe(this.gif.createWriteStream({repeat: this.repeat, delay: this.delay}))
        .pipe(fs.createWriteStream(this.outputName))
        .on('error', (err) => this.handleErr(err))
        .on('finish', () => {
          this.clean()
          this.resolve(this.outputName)
        })
    })
  }

  clean () {
    var path = this.tmpDir
    fs.readdir(path, (err, files) => {
      if (err) this.handleErr(err)

      for (const file of files) {
        fs.unlink(path+'/'+file, err => {
          if (err) this.handleErr(err)
        })
      }
    })
  }


}
