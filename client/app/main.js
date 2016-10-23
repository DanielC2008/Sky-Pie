'use strict'

const angular = require('angular')
const socket = io()
const rtc = require('rtc-everywhere')()

angular
  .module('Sky-Pie', [])
  .controller('main', function ($scope) {

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

  	socket.on('connect', () => {
  	  $scope.socket = socket.id
  	  $scope.$apply()
  	})

    socket.on('new user', Users => {
      $scope.Users = Users
      $scope.$apply()
    })

    socket.on('user disconnect', Users => {
      $scope.Users = Users
      $scope.$apply()
    })

    socket.on('answer or reject', caller => {
      $scope.caller = caller
      $scope.call = `${$scope.caller} would like to start a Sky-Pie Call with you!`
      $scope.$apply()
    })

    socket.on('call rejected', () => {
      alert('The person you were calling is unavailable')
    })

    socket.on('room ready', () => {
      console.log("YEA")
    })


  })
