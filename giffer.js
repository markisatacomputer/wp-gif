const fs       = require('fs')
const moment   = require('moment')
const gif      = require('gifencoder')
const Buffer   = require('buffer').Buffer
const request  = require('request')
const gm       = require('gm')

const frameUrlBase = "https://qt.exploratorium.edu/roofcam/Observatory/image.jpg"

//  See https://github.com/aheckmann/gm/issues/572
function gmToBuffer (data) {
  return new Promise((resolve, reject) => {
    data.stream((err, stdout, stderr) => {
      if (err) { return reject(err) }
      const chunks = []
      stdout.on('data', (chunk) => { chunks.push(chunk) })
      // these are 'once' because they can and do fire multiple times for multiple errors,
      // but this is a promise so you'll have to deal with them one at a time
      stdout.once('end', () => { resolve(Buffer.concat(chunks)) })
      stderr.once('data', (data) => { reject(String(data)) })
    })
  })
}

module.exports = class Giffer {

  constructor (options) {
    if (typeof(options.email) == 'string') this.email = options.email
    else return new Error('email required.')

    this.period = options.period ? options.period : 5
    this.start = options.start ? options.start : 0
    this.totalFrames = options.totalFrames ? options.totalFrames : 20
    this.frequency = this.calcFrequency()
    this.frame = 0
    this.interval
    this.width = options.width ? options.width : 320
    this.height = options.height ? options.height: 240
    this.frameUrlBase = options.url ? options.url : frameUrlBase
  }

  init () {
    var promised

    //  create gif
    this.animated = new gif(this.width, this.height)
    this.animated.setRepeat(0)
    this.animated.setDelay(333)
    this.animated.createReadStream().pipe(fs.createWriteStream('./finished/animated-'+moment().valueOf()+'.gif'))
    //this.animated.setOutputFile('./finished/animated-'+d+'.gif')
    //this.animated.setTmpDir('./tmp')

    //  add frames
    promised = new Promise( (resolve, reject) => {
      var self = this
      this.getFrame()
      this.interval = setInterval(function () { self.getFrame() }, this.frequency)
    })

    //  return a promise
    return promised
  }

  handleErr (err) {
    if (typeof(this.interval) == 'Timeout') clearInterval(this.interval)
    console.log(err)
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
    var self, frame, frameUrl, tmp

    this.frame++
    console.log('Writing frame '+this.frame+' of '+this.totalFrames+' total frames.\n')

    frameUrl = this.frameUrlBase + "?t=" + Date.now()
    //frame = request(frameUrl)
    tmp = gm( request(frameUrl) ).resize(this.width)
    gmToBuffer(tmp).then( (buffer) => {
      //  add frame to animated
      this.animated.addFrame(buffer)
      //  finish
      if (this.frame == this.totalFrames) {
        clearInterval(this.interval)
        this.animated.finish()
      }
    }).catch((err) => {
      this.handleErr(err)
    })

  }

  write () {
    this.animated.encode((status, err) => {
      if (status) console.log('animated gif successfully written to animated-async.gif')
      else {
        console.log('failed writing animated gif: ' + err)
        throw err
      }
    })
  }

}
