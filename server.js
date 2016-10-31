'use strict'

const express = require('express')
const { Server } = require('http')
const socketio = require('socket.io')
const twilio = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN)

const app = express()
const server = Server(app)
const io = socketio(server)
const PORT = process.env.PORT || 3000
const Users = []
let room


//SET 

//USE
app.use(express.static('client'))

//ROUTES


//SOCKETS
io.on('connection', socket => {
	console.log(`Socket connected on: ${socket.id}`)
  let localUser = {
    name: 'Anonymous',
    socket: socket.id
  }
	Users.push(localUser)
	io.emit('new user', Users)

/////////////CALL////////////////
	socket.on('call', userToCall => { 
    Users.forEach( (user, index) => {
      if (user.socket === socket.id) {
		    socket.broadcast.to(userToCall.socket).emit('answer or reject', user)
      }
    })
	})

	socket.on('join', callersRoom => {
		room = callersRoom
		socket.join(callersRoom)
		socket.broadcast.to(callersRoom).emit('room ready')
	})

	socket.on('call rejected', caller => {
		socket.broadcast.to(caller).emit('call rejected')
	})


/////////////CHAT/////////////////
  socket.on('new message', message => {
    socket.broadcast.to(room).emit('new message', message)
  })




///////////WEBRTC////////////////
  socket.on('get tokens', () => {
    twilio.tokens.create((err, response) =>{
      if(err){
        console.log(err)
      } else {
        socket.emit('offer tokens', response)
      }
    })
  })

  socket.on('candidate', (candidate) => {
    socket.broadcast.to(room).emit('candidate', candidate) 
  })  

  socket.on('offer', offer => {
  	twilio.tokens.create((err, response) =>{
      if(err){
        console.log(err)
      } else {
        let offerObj = {
        	tokens: response,
        	offer: offer
        }
    		socket.broadcast.to(room).emit('offer', offerObj)
      }
    })
  })

  socket.on('answer', answer => {
    socket.broadcast.to(room).emit('answer', answer)
  })

  socket.on('both users configured', () => {
  	io.to(room).emit('start call')
  })

  socket.on('end call button', socketToRemove => { 
 		//only remove socket that was called NOT caller
 		//if called remove
  	if (socket.id === socketToRemove) {
  		socket.leave(room)
  	}
  	//emit to room/update dom	
    socket.broadcast.to(room).emit('end call button', socketToRemove)
  })

	socket.on('disconnect', () => {
		Users.filter( (user, index) => {
      if (user.socket === socket.id) {
        Users.splice(index, 1)
      }
    })
		console.log(`${socket.id} disconnected`)
		io.to(room).emit('end call')
		io.emit('user disconnect', Users)
	})
})

//LISTEN
server.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
