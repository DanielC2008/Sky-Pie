'use strict'

const angular = require('angular')
const socket = io()
const rtc = require('rtc-everywhere')()

angular
  .module('Sky-Pie', [])
  .controller('main', function ($scope) {
    let peerConnection;

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
      let localVideo = document.getElementById('local-video')
      localVideo.volume = 0;
      let localStream = stream;
      let streamUrl = window.URL.createObjectURL(stream);
      localVideo.src = streamUrl;
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
      socket.emit('getTokens')
      peerConnection = new rtc.RTCPeerConnection({
        iceServers: [{url: "stun:global.stun.twilio.com:3478?transport=udp" }]
       })
      console.log(peerConnection)
    }

    const tokenSuccess = (tokens) => {
      peerConnection = new rtc.RTCPeerConnection({
       iceServers: tokens.iceServers
      })
      console.log(peerConnection)

      peerConnection.onicecandidate = onIceCandidate
    }
 
    const onIceCandidate = (event) => {
      console.log('here')
      if(event.candidate){
        console.log('Generated candidate!');
        socket.emit('candidate', JSON.stringify(event.candidate));
      }
    }

    const onCandidate = (candidate) => {
      console.log('hello')
      rtcCandidate = new RTCIceCandidate(JSON.parse(candidate));
      peerConnection.addIceCandidate(rtcCandidate);
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
    socket.on('tokens', (tokens) => {
      tokenSuccess(tokens)
    })

    socket.on('candidate', (candidate) => {
      onCandidate(candidate)
    })


  })
