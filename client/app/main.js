'use strict'

const angular = require('angular')
const socket = io()
const rtc = require('rtc-everywhere')()

angular
  .module('Sky-Pie', [])
  .controller('main', function ($scope) {
    let peerConnection
    let localVideo
    let localStream
    let streamUrl
    $scope.title = 'Sky-Pie'

    //get user media
    $scope.getUserMedia = () => {
      rtc.getUserMedia({video: true, audio: true},function(err, stream){
        if (stream) {
          onStream(stream)
        } else {
  		    streamRejected(err)
        }
      })
	  }

    //local video on video tag
    const onStream = (stream) => {
      localVideo = document.getElementById('local-video')
      localVideo.volume = 0
      localStream = stream
      streamUrl = window.URL.createObjectURL(stream)
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

    const tokenSuccess = (offerOrAnswer) => {
      console.log('success')
      return (tokens) => {
        console.log('on success', tokens)
        peerConnection = new rtc.RTCPeerConnection({
         iceServers: tokens.iceServers
        })
        peerConnection.onicecandidate = onIceCandidate
        peerConnection.addStream(localStream)
        offerOrAnswer()
      }  
    }
 
    const createOffer = () => {
      console.log('lets make an offer')
      peerConnection.createOffer((offer) => { ///////////////////////make promise structure
      peerConnection.setLocalDescription(offer)
        socket.emit('offer', JSON.stringify(offer))
      },
      (err) => {
        console.log(err)
      })
    }

    const onOffer = (offer) => {
      socket.emit('get tokens')
    }

    const createAnswer = (offer) => {
      return () =>{
        let sessionDescription = new RTCSessionDescription(JSON.parse(offer))
        peerConnection.setRemoteDescription(sessionDescription)
        peerConnection.createAnswer( (answer) => { ///////////////////////make promise structure
          peerConnection.setLocalDescription(answer)
          socket.emit('answer', JSON.stringify(answer))
        },
        (err) =>{
          console.log(err)
        })
      }
    }

    const onIceCandidate = (event) => {
      if(event.candidate){
        socket.emit('candidate', JSON.stringify(event.candidate))
      }
    }

    const onCandidate = (candidate) => {
      let rtcIceCandidate = new RTCIceCandidate(JSON.parse(candidate))
      peerConnection.addIceCandidate(rtcIceCandidate)
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
    socket.on('offer tokens', tokenSuccess(createOffer)) //make sure tokens is being passed

    socket.on('answer tokens', tokens => {
     tokenSuccess(createAnswer(offer)) // make sure tokens is being passed
    })

    socket.on('candidate', candidate => {
      onCandidate(candidate)
    })

    socket.on('offer', offer => {
      console.log('offer sent to called')
      // onOffer(offer)
    })



  })
