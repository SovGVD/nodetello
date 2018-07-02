'use strict';

//const cluster = require('cluster');
//const doThreads = require('os').cpus().length;

const NodeTello = require('./lib/nodetello.js');

var drone = new NodeTello();
drone.save_video_path = "./video/";
drone.tello_video_output = function (h264) { console.log("video feed:", h264); };
drone.init();
