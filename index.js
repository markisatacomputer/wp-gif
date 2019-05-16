
'use strict';

const express  = require('express')
const bdParse  = require('body-parser').urlencoded()
const attach   = require('./attach.js')
const app      = express()

app.use(bdParse)
app.use(attach)


app.get('*', (req, res) => (res.send('Hello there')) )

app.post('/create', (req, res) => {
  req.gif.init().then((path) => {
    console.log('done! -- '+path)
  })
  res.send('gif creation initiated.\n')
})

app.listen(3030, () => console.log('Wire Pier GIF Machine listening on 3030.'))
