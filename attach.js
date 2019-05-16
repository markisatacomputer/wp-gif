const giffer   = require('./giffer.js')

module.exports = function (req, res, next) {
  //  Attach to response
  var gif = new giffer(req.body)
  if (typeof(gif) == 'Error') res.send(err)
  else req.gif = gif

  //  Move on
  next()
}