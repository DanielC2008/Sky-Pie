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
    

	socket.on('connect', () => {
	    $scope.user = socket.id
	    $scope.$apply()
	  })


  })
