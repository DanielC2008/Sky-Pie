'use strict'

const express = require('express')
const { Server } = require('http')
const socketio = require('socket.io')

const app = express()
const server = Server(app)
const io = socketio(server)
const PORT = process.env.PORT || 3000
const Users = []
//SET
app.set('views', './views')
app.set('view engine', 'pug')


//USE
app.use(express.static('public'))

//ROUTES
app.get('/', (req, res) => res.render('index'))

//SOCKETS
io.on('connection', socket => {
	Users.push(socket.id)
	io.emit('new user', Users)

	console.log(`Socket connected on: ${socket.id}`)

	socket.on('disconnect', () => {
		let removeUser = Users.indexOf(`${socket.id}`)
		Users.splice(removeUser, 1)
		console.log(`${socket.id} disconnected`)
		io.emit('user disconnect', Users)
	})
})

//LISTEN
server.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
