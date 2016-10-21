'use strict'

const socket = io()


socket.on('new user', Users => {
	console.log(Users);
})

socket.on('user disconnect', Users => {
	console.log(Users);
})

