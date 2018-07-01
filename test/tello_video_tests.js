const fs = require('fs');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
var ws = false;	// send to last connected client only

var output_type="h264_baseline";	// rgba, png, jpeg (nope), h264_baseline


init_ffmpeg();


var d = fs.readFileSync("video.base64.raw", 'utf8').split("\n\n");

var img_length=960*720*4;	// frame 960 x 720 x rgba
var headers = { 
	png: Buffer([137, 80, 78, 71, 13, 10, 26, 10]),	// png header
	jpg: Buffer([255, 216, 255]),			// jpeg header
	h264_baseline: Buffer([0,0,0,1]),		// NAL unit
};
if (output_type=='rgba') {
	var img = Buffer.alloc(img_length);
	var cursor=0;
	var new_cursor=0;
} else if (output_type=='png' || output_type=='jpg' || output_type == 'h264_baseline'){
	var img = [];
}
var frame_id=0;	// possible overflow?
var frame_data=false;

function init_ffmpeg () {

	if (output_type=='rgba') {
		ffmpeg = spawn ('ffmpeg', [ '-f', 'h264', '-i', "-", '-c:v', 'rawvideo', '-pix_fmt', 'rgba', '-f', 'image2pipe', '-']);
	} else if (output_type == 'h264_baseline') {
		ffmpeg = spawn ('ffmpeg', [ '-f', 'h264', '-i', "-", '-c:v', 'libx264', '-b:v', '1M', '-profile', 'baseline', '-preset', 'ultrafast', "-pass", "1", "-coder", "0", "-bf", "0", "-flags", "-loop", "-wpredp", "0", '-an', '-f', 'h264', '-']);	// for Broadway h264 JS encoder
		//ffmpeg = spawn ('ffmpeg', [ '-f', 'h264', '-i', "-", '-r', '30', '-vcodec', "copy", '-an', '-f', 'h264', '-']);	// for Broadway h264 JS encoder
	} else {
		ffmpeg = spawn ('ffmpeg', [ '-f', 'h264', '-i', "-", '-c:v', (output_type=='jpeg'?'j???':output_type), '-f', 'image2pipe', '-']);
	}


	ffmpeg.stderr.on('data', (data) => {
		console.log("ffmpeg error", data.toString())});

	ffmpeg.stdout.on('data', (data) => {
		if (output_type=='rgba') {
			new_cursor=(cursor+data.length);
			if (new_cursor>img_length) {
				new_cursor = img_length-cursor;
				data.copy(img, cursor, 0, new_cursor);
				frame_data = img.toString('binary');
				//fs.writeFile("frames_rgba/"+frame_id+".rgba",img, function (frame_id) { console.log(frame_id,"saved") }.bind(null,frame_id) );
				//ws.send(img);
				data.copy(img,0,new_cursor);
				cursor = data.length - new_cursor;
				frame_id++;
			} else if (new_cursor==img_length) {
				// hope
				data.copy(img,cursor);
				frame_data = img.toString('binary');
				//fs.writeFile("frames_rgba/"+frame_id+".rgba",img, function (frame_id) { console.log(frame_id,"saved, wow!") }.bind(null,frame_id) );
				//ws.send(img);
				cursor=0;
				frame_id++;
			} else {
				data.copy(img,cursor);
				cursor+=data.length;
			}
		//} else if (output_type == 'h264_baseline') {
		} else {
			var idx = data.indexOf(headers[output_type]);
			if (idx>-1 && img.length>0) {
				img.push(data.slice(0,idx));
				frame_data = Buffer.concat(img);
				//fs.writeFile("frames_png/"+frame_id+".png",img, function (frame_id) { console.log(frame_id,"saved") }.bind(null,frame_id) );
				img=[];
				img.push(data.slice(idx));
				frame_id++;
			} else {
				img.push(data);
			}
		}
	});
}

var i=0;
var i_max=d.length;

function send_to_ffmpeg () {
	if (d[i].length>0) {
		var p = Buffer.from(d[i], 'base64');
		ffmpeg.stdin.write(p.slice(2));
		//console.log("send",i,d.length);
		//setTimeout(send_to_ffmpeg,4);
	}
	i++;
	if (i>=i_max) i=0;
}


//setTimeout(send_to_ffmpeg,100);
setInterval(send_to_ffmpeg,5);

//console.log(total);


wss.on('connection', function connection(_ws) {
  _ws.on('message', function incoming(message) {
    //console.log('received: %s', message);
    try {
		if (frame_data!==false) {
			//console.log("send frame");
			if (output_type == 'rgba' || output_type == 'h264_baseline') {
				_ws.send(frame_data.toString('binary'));
			} else {
				_ws.send("data:image/"+output_type+";base64,"+frame_data.toString('base64'));
			}
			frame_data=false;
		} else {
			//console.log("frame not ready");
		}
	} catch (e) {
		//_ws.send("false");
		//console.log("error",e);
	}
  });
  ws=_ws;
});
