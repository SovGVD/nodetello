# Ryze Tello drone Node.JS library
Based on [PyTello](https://bitbucket.org/PingguSoft/pytello)

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
web client must be available on http://127.0.0.1:8080 and show awful trash video from drone with huge lag =(

## Convert video
video stored to `./video/TIMESTAMP.h264` and must be redecode, e.g. `ffmpeg -i TIMESTAMP.h264 -crf 20 video.mp4`
