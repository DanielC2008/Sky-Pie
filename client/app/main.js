'use strict'

const angular = require('angular')
const socket = io()
const rtc = require('rtc-everywhere')()

angular
  .module('Sky-Pie', [])
  .controller('main', function ($scope) {

    $scope.title = 'Sky-Pie'

    $scope.getUserMedia = () => {
      //get user media
      rtc.getUserMedia({video: true, audio: true},function(err, stream){
        if (stream) {
          onStream(stream)
        } else {
  		    streamRejected(err)
        }
      })
	  }

    const onStream = (stream) => {
      let localVideo = document.getElementById('local-video')
      localVideo.volume = 0;
      let localStream = stream;
      let streamUrl = window.URL.createObjectURL(stream);
      localVideo.src = streamUrl;
    }

    const streamRejected = () => {
    	console.log('media rejected')
    }
    

    $scope.callUser = socketToCall => {
      socket.emit('call', socketToCall)
    }


    $scope.joinRoom = (caller) => {
      socket.emit('join', caller)
      $scope.call = null
    }

    $scope.rejectCall = (caller) => {
      //emit rejected call
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

    socket.on('room ready', () => {
      console.log("YEA")
    })


  })
