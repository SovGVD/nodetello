# Ryze Tello drone Node.JS library
Based on [PyTello](https://bitbucket.org/PingguSoft/pytello), [TelloLib](https://github.com/Kragrathea/TelloLib) and [the tello Go](https://github.com/SMerrony/tello)

## How to
```
const NodeTello = require('./lib/nodetello.js');
const NodeTello_webclient = require('./lib/nodetello_webclient.js');

// init web client
var webclient = new NodeTello_webclient();
    webclient.init();

// init drone
var drone = new NodeTello();

// set video path
drone.save_video_path = "./video/";
// set callback for video feed
drone.tello_video_output = function (h264) { webclient.h264encoder_in(h264); };
// lets go!
drone.init();
```

### Init
Init process is basic at that moment:
 - connect to drone
 - get some settings/values (version and altitude limit)
 - set settings (stick position)
 - init video feed
 - start video transcode (required ffmpeg!)
 - start http server and websocket

## Web client
Web client must be available on http://127.0.0.1:8080 and show almost fine video from drone with 0.5 secods lag.

## Convert video
Video feeds stored to `./video/TIMESTAMP.h264` and must be redecode, e.g. `ffmpeg -i TIMESTAMP.h264 -crf 20 video.mp4`

## Flight data and log

### Flight data
 - altitude
 - version
 - speed
 - fly_time
 - wifi
 - other...

### Log
 - 29 - MVO (not all fields)
 - 2048 - IMU (not all fields)
 - 16
 - 1000
 - 1001
 - 1002
 - 2064
 - 2208
 - 10086
 - 10085
 - 32768
 
