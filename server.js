'use strict'

const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000

//SET
app.set('views', './views')
app.set('view engine', 'pug')


//USE
app.use(express.static('public'))

//ROUTES
app.get('/', (req, res) => res.render('index'))


//LISTEN
app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
