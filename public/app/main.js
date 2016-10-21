'use strict'

const angular = require('angular')
const socket = io()


angular
  .module('mean101', [])
  .controller('main', function ($scope) {
    $scope.title = 'MEAN 101'
		socket.on('connect', () => {
	    $scope.user = socket.id
	    $scope.$apply()
	  })
  })
