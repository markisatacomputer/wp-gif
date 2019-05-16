
'use strict';

const express    = require('express')
const bdParse    = require('body-parser').urlencoded()
const attach     = require('./attach.js')
const mailer     = require('./mailer.js')
const app        = express()


//  express middleware
app.use(bdParse)
app.use(attach)
app.use(mailer)

//  Everything else
app.get('*', (req, res) => (res.send('Hello there')) )
//  Create Animated GIF
app.post('/create', (req, res) => {

  //  Init GIF
  req.gif.init().then((path) => {
    console.log('done! -- '+path)

    //  Send mail on completion
    if (req.mailer) {
      //  parse email
      let fname = path.split('/').pop()
      //
      let info = req.mailer.sendMail({
        from: process.env.MAILUSER,
        to: req.body.email,
        subject: "Your explo gif is ready!",
        text: "You'll find it attached to this message.  Enjoy!",
        attachments: [
          {
            filename: fname,
            path: path
          }
        ]
      }).then(
        (r) => console.log('mail success', r),
        (e) => console.log('mail err', e)
      )
    }
  })

  res.send('gif creation initiated.\n')
})

app.listen(3030, () => console.log('Wire Pier GIF Machine listening on 3030.'))
