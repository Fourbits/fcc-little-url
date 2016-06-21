var angular = require('angular');
var ngclipboard = require('ngclipboard');
var mySite = ('https://fcc-little-url-fourbits.c9users.io/');


var app = angular.module('linkApp', ['ngclipboard']);
app.controller('LinkController', function($http) {
    var lCtrl = this;
    lCtrl.origUrl = '';
    lCtrl.shortUrl = '';

    lCtrl.urlChanged = function() {
        lCtrl.shortUrl = '';
    };

    lCtrl.shorten = function() {
        $http.get('./new/' + lCtrl.origUrl).then(function(response) {
            if (response.data.error){
                return console.log(response.data.error);
            }
            lCtrl.shortUrl = response.data['short_url'];
        });
    };
});