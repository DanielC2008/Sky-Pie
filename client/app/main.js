'use strict'

const angular = require('angular')
const socket = io()
const rtc = require('rtc-everywhere')()

angular
  .module('Sky-Pie', [])
  .controller('main', function ($scope) { //////////////function
    let peerConnection
    let localVideo = document.getElementById('local-video')
    let remoteVideo = document.getElementById('remote-video')
    let localStream
    let streamUrl
    $scope.title = 'Sky-Pie'

    //get user media
    $scope.getUserMedia = () => {
      rtc.getUserMedia({video: true, audio: true},function(err, stream){ ///////function
        if (stream) {
          onStream(stream)
        } else {
  		    streamRejected(err)
        }
      })
	  }

    //local video on video tag
    const onStream = (stream) => {
      localVideo.volume = 0
      localStream = stream
      streamUrl = window.URL.createObjectURL(stream) ///// these two in one step
      localVideo.src = streamUrl 
    }

    //user rejected request or err
    const streamRejected = () => {
    	console.log('media rejected')
    }

    //socket requests another to join their room   
    $scope.callUser = socketToCall => {
      socket.emit('call', socketToCall)
    }

    //called accepts and joins room
    $scope.joinRoom = (caller) => {
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
      var rtcAnswer = new RTCSessionDescription(JSON.parse(answer))
      peerConnection.setRemoteDescription(rtcAnswer)
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
      $scope.Users = Users
      $scope.$apply()
    })

    //someone is called
    socket.on('answer or reject', caller => {
      $scope.caller = caller
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
      startCall()
    })
    //tokens have been generated
    socket.on('offer tokens', tokens => { //change socket names
      tokenSuccess(tokens)
      createOffer()
    }) //make sure tokens is being passed

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



  })