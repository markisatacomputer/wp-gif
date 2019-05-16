const giffer   = require('./giffer.js')

module.exports = function (req, res, next) {
  var opts = {}
  var gif
  console.log(req.body)

  //  Attach to response
  gif = new giffer(req.body)
  console.log(gif)
  if (typeof(gif) == 'Error') res.send(err)
  else req.gif = gif

  //  Move on
  next()
}