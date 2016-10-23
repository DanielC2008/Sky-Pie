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



//USE
app.use(express.static('client'))

//ROUTES



//SOCKETS
io.on('connection', socket => {
	console.log(`Socket connected on: ${socket.id}`)

	Users.push(socket.id)
	io.emit('new user', Users)

	socket.on('join', (room) => {
		socket.join(`${room}`)
	})


	socket.on('disconnect', () => {
		let removeUser = Users.indexOf(`${socket.id}`)
		Users.splice(removeUser, 1)
		console.log(`${socket.id} disconnected`)
		io.emit('user disconnect', Users)
	})
})

//LISTEN
server.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
