# Ryze Tello drone Node.JS library
Based on [PyTello](https://bitbucket.org/PingguSoft/pytello)

## How to
```
const NodeTello = require('./lib/nodetello.js');
var drone = new NodeTello();

// set video path
drone.save_video_path = "./video/";

// set callback for video feed (will be ffmpeg+broadway h264 decoder, see example in tests)
drone.tello_video_output = function (h264) { console.log("video feed:", h264); };
// lets go!
drone.init();
```

### Init
Init process is basic at that moment:
 - connect to drone
 - get some settings/values (version and altitude limit)
 - set settings (stick position)
 - init video feed

## Convert video
video stored to `./video/TIMESTAMP.h264` and must be redecode, e.g. `ffmpeg -i TIMESTAMP.h264 -crf 20 video.mp4`
