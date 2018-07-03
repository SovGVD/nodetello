'use strict';

//const cluster = require('cluster');
//const doThreads = require('os').cpus().length;


const NodeTello = require('./lib/nodetello.js');
const NodeTello_webclient = require('./lib/nodetello_webclient.js');

var webclient = new NodeTello_webclient();
	webclient.init();


var drone = new NodeTello();
	drone.save_video_path = "./video/";
	drone.tello_video_output = function (h264) { webclient.h264encoder_in(h264) };
	drone.init();
