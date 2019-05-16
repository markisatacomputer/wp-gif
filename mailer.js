const nodemailer = require("nodemailer")

module.exports = function (req, res, next) {
  //  Attach mailer to request
  if (req.body.email) {
    req.mailer = nodemailer.createTransport({
      debug: true,
      host: process.env.MAILHOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAILUSER,
        pass: process.env.MAILPASS
      }
    })
  }

  //  Move on
  next()
}