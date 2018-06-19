const fs = require('fs');
const { spawn } = require('child_process');

var d = fs.readFileSync("video.base64.raw", 'utf8').split("\n\n");

var ffmpeg = spawn ('ffmpeg', [ '-i', '-', '-c:v', 'rawvideo', '-pix_fmt', 'rgba', '-f', 'image2pipe', '-']);

var img_length=960*720*4;	// frame 960 x 720 x rgba
var img = Buffer.alloc(img_length);
var cursor=0;
var new_cursor=0;
var frame_id=0;

ffmpeg.stdout.on('data', (data) => {
	new_cursor=(cursor+data.length);
	if (new_cursor>img_length) {
		new_cursor = img_length-cursor;
		data.copy(img, cursor, 0, new_cursor);
		fs.writeFile("frames_rgba/"+frame_id+".rgba",img, function (frame_id) { console.log(frame_id,"saved") }.bind(null,frame_id) );
		data.copy(img,0,new_cursor);
		cursor = data.length - new_cursor;
		frame_id++;
	} else if (new_cursor==img_length) {
		// hope
		data.copy(img,cursor);
		fs.writeFile("frames_rgba/"+frame_id+".rgba",img, function (frame_id) { console.log(frame_id,"saved, wow!") }.bind(null,frame_id) );
		cursor=0;
		frame_id++;
	} else {
		data.copy(img,cursor);
		cursor+=data.length;
	}
});


var current_pack_id=false;
for (var i in d) {
	if (d[i].length>0) {
		var p = Buffer.from(d[i], 'base64');
		ffmpeg.stdin.write(p.slice(2));
	}
}


//console.log(total);
