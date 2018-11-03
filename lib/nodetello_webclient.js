'use strict'

const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');
const WebSocket = require('ws');


var nodetello_webclient = function (videobackend) {
	this.videobackend = videobackend;
	this.path = './public_html/';
	this.http_port = 8080;
	this.ws_video_port = 8081;
	this.ws_telemetry_port = 8082;
	this.file2mime = {
			".html" : { t:'text/html',                e:'utf8'   },
			".js"   : { t:'application/javascript',   e:'utf8'   },
			".wasm" : { t:'application/wasm',         e:'binary' },
			".ico"  : { t:'image/x-icon',             e:'binary' },
			".css"  : { t:'text/css',                 e:'utf8'   },
			".map"  : { t:'application/json',         e:'utf8'   },
		};
	this.headers = { 
		"png"           : Buffer([137, 80, 78, 71, 13, 10, 26, 10]),	// png header
		"jpg"           : Buffer([255, 216, 255]),						// jpeg header
		"h264_baseline" : Buffer([0,0,0,1]),							// h264 NAL unit
	};
	this.wss_video = false;
	this.wss_telemetry = false;
	this._ws_video_client = false;
	this._ws_telemetry_client = false;
	if (this.videobackend == 'ffmpeg') {
		this.h264encoder_spawn = {
			"command" : 'ffmpeg',	// for mac just change to ./ffmpeg and put ffmpeg binary into the same folder
			//"args"    : [ '-fflags', 'nobuffer', '-f', 'h264', '-i', "-", '-c:v', 'libx264', '-b:v', '3M', '-profile', 'baseline', '-preset', 'ultrafast', '-pass', '1', '-coder', '0', '-bf', '0', '-flags', '-loop', '-wpredp', '0', '-an', '-f', 'h264', '-']
			//"args"      : [ '-f', 'h264', '-i', "-", '-r', '35', '-c:v', 'libx264', '-b:v', '3M', '-profile', 'baseline', '-preset', 'ultrafast', '-tune', 'zerolatency', '-vsync', '0', '-async', '1', '-bsf:v', 'h264_mp4toannexb', '-x264-params','keyint=15:scenecut=0', '-an', '-f', 'h264', '-']
			//"args"      : [ '-f', 'h264', '-i', "-", '-r', '30', '-c:v', 'libx264', '-b:v', '3M', '-profile', 'baseline', '-preset', 'ultrafast', '-tune', 'zerolatency', '-vsync', '0', '-async', '1', '-bsf:v', 'h264_mp4toannexb', '-an', '-f', 'h264', '-']
			"args"      : [ '-fflags', 'nobuffer', '-f', 'h264', '-i', "-", '-r', '30', '-c:v', 'libx264', '-b:v', '2M', '-profile', 'baseline', '-preset', 'ultrafast', '-tune', 'zerolatency', '-vsync', '0', '-async', '0', '-bsf:v', 'h264_mp4toannexb', '-x264-params','keyint=5:scenecut=0', '-an', '-f', 'h264', '-']
			//"args"      : [ '-f', 'h264', '-i', "-", '-r', '30', '-c:v', 'libx264', '-b:v', '3M', '-profile', 'baseline', '-preset', 'ultrafast', '-tune', 'zerolatency', '-async', '1', '-an', '-f', 'h264', '-']
		};
	} else if (this.videobackend == 'mplayer') {
		this.h264encoder_spawn = {
			"command" : 'mplayer',
			"args" : [ '-gui', '-nolirc' ,'-fps', '35', '-really-quiet', '-' ]
		};
	}
	this.h264encoder = false;
	this.h264chunks = [];
	this.h264unit = false;
	
	this.tello_cmd = false;
	
	this.init = function () {
		this.wss_init();
		this.h264encoder_init();
		http.createServer(function (req, res) {this._http_res(req, res)}.bind(this)).listen(this.http_port);
	}
	
	this.h264encoder_init = function () {
		this.h264encoder = spawn( this.h264encoder_spawn.command, this.h264encoder_spawn.args);
		
		this.h264encoder.stderr.on('data', function (data) {
				//console.log("ffmpeg error", data.toString());
		}.bind(this));
		
		this.h264encoder.stdout.on('data', function (data) {
			var idx = data.indexOf(this.headers['h264_baseline']);
			if (idx>-1 && this.h264chunks.length>0) {
				this.h264chunks.push(data.slice(0,idx));
				if (this._ws_video_client!==false) {
					try {
						this._ws_video_client.send(Buffer.concat(this.h264chunks).toString('binary'));
					} catch (e) { this._ws_video_client = false }
				}
				this.h264chunks=[];
				this.h264chunks.push(data.slice(idx));
			} else {
				this.h264chunks.push(data);
			}
		}.bind(this));
	}
	this.h264encoder_in = function (h264chunk) {
		this.h264encoder.stdin.write(h264chunk);
	}

	this.telemetry_in = function (data) {
		if (this._ws_telemetry_client !== false) {
			try {
				this._ws_telemetry_client.send(data);
			} catch (e) { this._ws_telemetry_client = false; }
		}
	}

	
	this.wss_init = function () {
		// Video Feed
		this.wss_video = new WebSocket.Server({ port: this.ws_video_port });
		this.wss_video.on('connection', function connection(ws) {
			ws.on('message', function (message) {
				this._ws_video_client = ws;
				try {
					// nothing to do
				} catch (e) {
					ws.send("false");
					console.log("WSVIDEOERROR:",e);
				}
			}.bind(this));
		}.bind(this));
		
		// Telemetry Feed
		this.wss_telemetry = new WebSocket.Server({ port: this.ws_telemetry_port });
		this.wss_telemetry.on('connection', function connection(ws) {
			ws.on('message', function (message) {
				this._ws_telemetry_client = ws;
				try {
					if (message[0] == '{') {
						this.tello_cmd(JSON.parse(message));
					} else {
						console.log("WebClient",message);
					}
				} catch (e) {
					ws.send("false");
					console.log("WSTELEMETRYERROR:",e,"Message",message);
				}
			}.bind(this));
		}.bind(this));
	}
	
	this._http_res = function (req, res) {
		var url = req.url.split("/"); url.shift(); url = (url.join("/")).replace(new RegExp("\\.\\.",'g'),"");
		if (url=='') url="index.html";
		url = this.path+url;
		var type = url.split("."); 
			type="."+type.pop(); 
			console.log("HTTPREQ:", req.url, "as", url, "type", type);
			type = (typeof this.file2mime[type] !== undefined)?this.file2mime[type]:'text/html';
		fs.readFile(url, { encoding: type.e }, function (type, res, err, data) {
			if (err) {
				//console.log("HTTP404:", err);
				res.writeHead(404, {'Content-Type': 'text/html'});
				res.end("404 Not Found");
			} else {
				console.log("HTTP200:", type);
				res.writeHead(200, {'Content-Type': type.t});
				res.end(data, type.e);
			}
		}.bind(this, type, res));
	}
}

module.exports = nodetello_webclient;
