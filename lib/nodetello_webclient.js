'use strict'

const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');
const WebSocket = require('ws');


var nodetello_webclient = function () {
	this.path = './public_html/';
	this.http_port = 8080;
	this.ws_port = 8081;
	this.file2mime = {
			".html" : { t:'text/html',                e:'utf8'   },
			".js"   : { t:'application/javascript',   e:'utf8'   },
			".wasm" : { t:'application/octet-stream', e:'binary' },
			".ico"  : { t:'image/x-icon',             e:'binary' },
		};
	this.headers = { 
		"png"           : Buffer([137, 80, 78, 71, 13, 10, 26, 10]),	// png header
		"jpg"           : Buffer([255, 216, 255]),						// jpeg header
		"h264_baseline" : Buffer([0,0,0,1]),							// h264 NAL unit
	};
	this.wss = false;
	this._ws_client = false;
	this.h264encoder_spawn = {
			"command" : 'ffmpeg',
			//"args"    : [ '-fflags', 'nobuffer', '-f', 'h264', '-i', "-", '-c:v', 'libx264', '-b:v', '3M', '-profile', 'baseline', '-preset', 'ultrafast', '-pass', '1', '-coder', '0', '-bf', '0', '-flags', '-loop', '-wpredp', '0', '-an', '-f', 'h264', '-']
			//"args"      : [ '-f', 'h264', '-i', "-", '-r', '35', '-c:v', 'libx264', '-b:v', '3M', '-profile', 'baseline', '-preset', 'ultrafast', '-tune', 'zerolatency', '-vsync', '0', '-async', '1', '-bsf:v', 'h264_mp4toannexb', '-x264-params','keyint=15:scenecut=0', '-an', '-f', 'h264', '-']
			//"args"      : [ '-f', 'h264', '-i', "-", '-r', '30', '-c:v', 'libx264', '-b:v', '3M', '-profile', 'baseline', '-preset', 'ultrafast', '-tune', 'zerolatency', '-vsync', '0', '-async', '1', '-bsf:v', 'h264_mp4toannexb', '-an', '-f', 'h264', '-']
			"args"      : [ '-fflags', 'nobuffer', '-f', 'h264', '-i', "-", '-r', '30', '-c:v', 'libx264', '-b:v', '3M', '-profile', 'baseline', '-preset', 'ultrafast', '-tune', 'zerolatency', '-vsync', '0', '-async', '1', '-bsf:v', 'h264_mp4toannexb', '-x264-params','keyint=15:scenecut=0', '-an', '-f', 'h264', '-']
			//"args"      : [ '-f', 'h264', '-i', "-", '-r', '30', '-c:v', 'libx264', '-b:v', '3M', '-profile', 'baseline', '-preset', 'ultrafast', '-tune', 'zerolatency', '-async', '1', '-an', '-f', 'h264', '-']
		};
	this.h264encoder = false;
	this.h264chunks = [];
	this.h264unit = false;
	
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
				if (this._ws_client!==false) {
					this._ws_client.send(Buffer.concat(this.h264chunks).toString('binary'));
				//} else {
					//this.h264unit = Buffer.concat(this.h264chunks);
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
	
	this.wss_init = function () {
		this.wss = new WebSocket.Server({ port: this.ws_port });
		this.wss.on('connection', function connection(ws) {
			ws.on('message', function (message) {
				this._ws_client = ws;
				try {
					/*if (message == 'f') {
						// send frame
						if (this.h264unit!==false) {
							ws.send(this.h264unit.toString('binary'));
							this.h264unit=false;
						}
					} else {
						ws.send("false");
					}*/
				} catch (e) {
					ws.send("false");
					console.log("WSERROR:",e);
				}
			}.bind(this));
		}.bind(this));
	}
	
	this._http_res = function (req, res) {
		var url = req.url.split("/"); url.shift(); url = (url.join("/")).replace(new RegExp("\\.\\.",'g'),"");
		if (url=='') url="index.html";
		url = this.path+url;
		//console.log("HTTPREQ:", req.url, "as", url);
		var type = url.split("."); type="."+type.pop(); type = (typeof this.file2mime[type] !== undefined)?this.file2mime[type]:'text/html';
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
