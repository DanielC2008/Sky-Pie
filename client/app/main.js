'use strict'

const angular = require('angular')
const socket = io()
const rtc = require('rtc-everywhere')()

angular
  .module('Sky-Pie', [])
  .controller('main', ['$scope', ($scope) => {

    $scope.setName = (name) => {
      $scope.name = name
      $scope.nameToSet = ''
    }

/////////////CHAT//////////////////
    $scope.messages = []

    $scope.sendMessage = () => {
      let message = {
        author: socket.id,
        text: $scope.text
      }
      $scope.messages.push(message)
      $scope.text = ''
      socket.emit('new message', message)
    }

    //recieving new message
    socket.on('new message', message => {
      $scope.messages.push(message)
      $scope.$apply()
    })

    const clearMessages = () => {
      $scope.messages = []
    }

/////////// WEBRTC/////////////    
    let peerConnection
    let localVideo = document.getElementById('local-video')
    let remoteVideo = document.getElementById('remote-video')
    localVideo.volume = 0
    let localStream
    let streamUrl
    let streamArray

    $scope.inCall = false
    $scope.title = 'Sky-Pie'

    //get user media
    const getUserMedia = () => {
      rtc.getUserMedia((err, stream) => {
        if (stream) {
          onStream(stream)
        } else {
          console.log(err)
  		    alert('Media Rejected')
        }
      })
	  }

    //local video on video tag
    const onStream = (stream) => {
      localStream = stream
      localVideo.src = window.URL.createObjectURL(stream)
    }

    //socket requests another to join their room   
    $scope.callUser = socketToCall => {
      $scope.caller = socket.id
      $scope.called = socketToCall
      socket.emit('call', socketToCall)
    }

    //called accepts and joins room
    $scope.joinRoom = (caller) => {
      getUserMedia()
      socket.emit('join', caller)
      $scope.call = null
    }

    //called rejects call
    $scope.rejectCall = (caller) => {
      socket.emit('call rejected', caller)
      $scope.call = null
    }
    //set up STUN server and request tokens for TURN server
    const startCall = () => {
      socket.emit('get tokens')
      peerConnection = new rtc.RTCPeerConnection({
        iceServers: [{url: "stun:global.stun.twilio.com:3478?transport=udp" }]
      })
    }

    const tokenSuccess = (tokens) => {
      peerConnection = new rtc.RTCPeerConnection({
       iceServers: tokens.iceServers
      })
      peerConnection.addStream(localStream)
      peerConnection.onicecandidate = onIceCandidate
      peerConnection.onaddstream = onAddStream
    }
 
    const onIceCandidate = event => {
      if(event.candidate){
          socket.emit('candidate', JSON.stringify(event.candidate))
      }
    }

    const onCandidate = candidate => {
      if (peerConnection) {
        let rtcIceCandidate = new RTCIceCandidate(JSON.parse(candidate))
        peerConnection.addIceCandidate(rtcIceCandidate)
      }
    }

    const onAddStream = event => {
      remoteVideo.src = window.URL.createObjectURL(event.stream)
    }

    const createOffer = () => {
      peerConnection.createOffer((offer) => { ///////////////////////make promise structure
        peerConnection.setLocalDescription(offer)
        socket.emit('offer', JSON.stringify(offer)) // no stringify
      },
      (err) => {
        console.log(err)
      })
    }

    const createAnswer = (offer) => {
      let sessionDescription = new RTCSessionDescription(JSON.parse(offer))
      peerConnection.setRemoteDescription(sessionDescription)
      peerConnection.createAnswer( answer => { ///////////////////////make promise structure
        peerConnection.setLocalDescription(answer)
        socket.emit('answer', JSON.stringify(answer))
      },
      (err) => {
        console.log(err)
      })
    }

    const onAnswer = answer => {
      let rtcAnswer = new RTCSessionDescription(JSON.parse(answer))
      peerConnection.setRemoteDescription(rtcAnswer)
      socket.emit('both users configured')
    }

    $scope.endCallButton = () => {
      socket.emit('end call button', $scope.called)
      //remove user media tracks from user who clicked
      localStream.getTracks().map((track)=> {
        track.stop()
      })
      $scope.inCall = false
      clearMessages()
    }

    //socket connected
  	socket.on('connect', () => {
  	  $scope.socket = socket.id
  	  $scope.$apply()
  	})

    //new user joins server
    socket.on('new user', Users => {
      $scope.Users = Users
      $scope.$apply()
    })

    //user disconnects from server
    socket.on('user disconnect', Users => {
      $scope.inCall = false
      clearMessages()
      $scope.Users = Users
      $scope.$apply()
    })

    //someone is called
    socket.on('answer or reject', caller => {
      $scope.caller = caller
      $scope.called = socket.id
      $scope.call = `${$scope.caller} would like to start a Sky-Pie Call with you!`
      $scope.$apply()
    })

    //a call was rejected
    socket.on('call rejected', () => {
      alert('The person you are calling is unavailable')
    })

//connecting video stream
    //room ready
    socket.on('room ready', () => {
      getUserMedia()
      startCall()
    })
    //tokens have been generated
    socket.on('offer tokens', tokens => {
      tokenSuccess(tokens)
      createOffer()
    }) 

    socket.on('candidate', candidate => {
      onCandidate(candidate)
    })

    socket.on('offer', ({offer, tokens}) => {
        tokenSuccess(tokens)
        createAnswer(offer)
    })

    socket.on('answer', answer => {
      onAnswer(answer)
    })

    socket.on('start call', () => {
      $scope.inCall = true
      $scope.$apply()
    })

    socket.on('end call button', socketToRemove => {
      if (socketToRemove === socket.id) {
        socket.emit('end call button', socketToRemove)
      }
      //remove user media tracks 
      localStream.getTracks().map((track)=> {
        track.stop()
      })
      $scope.inCall = false
      clearMessages()
      $scope.$apply()
    })




  }])