'use strict'

const angular = require('angular')
const socket = io()
const rtc = require('rtc-everywhere')()

angular
  .module('Sky-Pie', [])
  .controller('main', ['$scope', ($scope) => {

//////////////USER NAME/////////////
    
    $scope.setName = (name) => {
      $scope.name = name
      socket.emit('updateName', name)
    }

/////////////CHAT//////////////////
    $scope.messages = []

    $scope.sendMessage = () => {
      let message = {
        author: $scope.name,
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

    //////////Ask user to join your room////////////
    //socket requests another to join their room   
    $scope.callUser = userToCall => {
      $scope.caller = socket.id
      $scope.called = userToCall.socket
      socket.emit('call', userToCall)
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

    //called accepts and joins room
    $scope.joinRoom = (caller) => {
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then( stream => {
        onStream(stream)
      })
      .then( () => {
        socket.emit('join', caller)
        $scope.call = null
      })
      .catch( err =>{
        alert('Media Rejected')
      })
    }

    //called rejects call
    $scope.rejectCall = (caller) => {
      socket.emit('call rejected', caller)
      $scope.call = null
    }

    /////////Set stream///////////
    //local video on video tag
    const onStream = (stream) => {
      localStream = stream
      localVideo.src = window.URL.createObjectURL(stream)
    }

    //////////Start Connection//////////////
    //set up STUN server and request tokens for TURN server
    const requestTokens = () => {
      socket.emit('get tokens')
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
      peerConnection.createOffer( offer => { 
        peerConnection.setLocalDescription(offer)
        socket.emit('offer', offer)
      },
      (err) => {
        console.log(err)
      })
    }

    const createAnswer = offer => {
      let sessionDescription = new RTCSessionDescription(offer)
      peerConnection.setRemoteDescription(sessionDescription)
      peerConnection.createAnswer( answer => {
        peerConnection.setLocalDescription(answer)
        socket.emit('answer', answer)
      },
      (err) => {
        console.log(err)
      })
    }

    const onAnswer = answer => {
      let rtcAnswer = new RTCSessionDescription(answer)
      peerConnection.setRemoteDescription(rtcAnswer)
      socket.emit('both users configured')
    }


    //socket connected
  	socket.on('connect', () => {
  	  $scope.socket = socket.id
  	  $scope.$apply()
  	})

    //new user joins server
    socket.on('new user', Users => {
      Users.forEach( (user, index) => {
        if (user.socket === socket.id) {
          $scope.name = user.name
        }
      })  
      $scope.Users = Users
      $scope.$apply()
    })

    //user disconnects from server
    socket.on('user disconnect', Users => {
      clearMessages()
      $scope.Users = Users
      $scope.$apply()
    })

    //someone is called
    socket.on('answer or reject', caller => {
      $scope.caller = caller.socket
      $scope.called = socket.id
      $scope.call = `${caller.name} would like to start a Sky-Pie Call with you!`
      $scope.$apply()
    })

    //a call was rejected
    socket.on('call rejected', () => {
      alert('The person you are calling is unavailable')
    })

//connecting video stream
    //room ready
    socket.on('room ready', () => {
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then((stream)=>{
        onStream(stream)
      })
      .then( () => {
        requestTokens()
      })
      .catch( err =>{
        alert('Media Rejected')
      })
    })
    
    //tokens have been generated
    socket.on('offer tokens', tokens => {
      tokenSuccess(tokens)
      createOffer()
    }) 
    //candidate was sent by other browser
    socket.on('candidate', candidate => {
      onCandidate(candidate)
    })
    //offer recieved
    socket.on('offer', ({offer, tokens}) => {
        tokenSuccess(tokens)
        createAnswer(offer)
    })
    //answer recieved
    socket.on('answer', answer => {
      onAnswer(answer)
    })
    //begin call
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