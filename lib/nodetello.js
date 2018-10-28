'use strict'

/* Ryze Tello drone Node.JS
 * based on PyTello https://bitbucket.org/PingguSoft/pytello
 * sovgvd@gmail.com
 */

// TODO, make it better... sometime...

const dgram = require('dgram');
const fs = require('fs');


var nodetello = function () {

	this.tello_control = dgram.createSocket('udp4');
	this.tello_video = dgram.createSocket('udp4');
	this.tello_video_output = false;	// callback function
	this.tello_telemetry_output = false;	// callback function
	this.tello_telemetry_config = false;	// fields to request
	this.save_video_path = false;
	this.save_photo_path = false;
	this.DEG = Math.PI / 180;
	
	this.TYPE = {
		BYTE : 1,
		SHORT: 2,
		FLOAT: 3,
	};
	
	// exposure values
	this.EV = {
			'-3.0' : -9, 
			'-2.7' : -8, 
			'-2.3' : -7, 
			'-2.0' : -6, 
			'-1.7' : -5, 
			'-1.3' : -4, 
			'-1.0' : -3, 
			'-0.7' : -2, 
			'-0.3' : -1, 
			'0.0'  : 0, 
			'+0.3' : 1, 
			'+0.7' : 2, 
			'+1.0' : 3, 
			'+1.3' : 4, 
			'+1.7' : 5, 
			'+2.0' : 6, 
			'+2.3' : 7, 
			'+2.7' : 8, 
			'+3.0' : 9
		};
		
	this.status = {
		altitude: {
			max: null,
		},
		version: null,
		speed: {
			north: null,
			east: null,
			ground: null,
			vertical: null,
		},
		fly_time: {
			time: null,
		},
		wifi: {
			signal: null,
			interference: null,
		},
		LOG: {
		},
		state: {
			imu: {
				state: null,
				calibration: null,
			},
			pressure: null,
			down_visual: null,
			power: null,
			battery: {
				state: null,
				percentage: null,
				left: null,
				low: null,
				lower: null,
				voltage: null,
			},
			gravity: null,
			wind: null,
			em: {
				state: null,
				sky: null,
				ground: null,
				open: null,
			},
			temperature_height: null,
			factory_mode: null,
			fly_mode: null,
			drone_hover: null,
			outage_recording: null,
			throw_fly_timer: null,
			camera: null,
			front: {
				in: null,
				out: null,
				lsc: null,
			}
		}
	}

	this.tello = {
		control: {
			host: '192.168.10.1',
			port: 8889
		},
		video: {
			port: 6037
		},
		commands: {
			TELLO_CMD_CONN: 1,
			TELLO_CMD_CONN_ACK: 2,
			TELLO_CMD_SSID: 17,
			TELLO_CMD_SET_SSID: 18,
			TELLO_CMD_SSID_PASS: 19,
			TELLO_CMD_SET_SSID_PASS: 20,
			TELLO_CMD_REGION: 21,
			TELLO_CMD_SET_REGION: 22,
			TELLO_CMD_REQ_VIDEO_SPS_PPS: 37,
			TELLO_CMD_TAKE_PICTURE: 48,
			TELLO_CMD_SWITCH_PICTURE_VIDEO: 49,
			TELLO_CMD_START_RECORDING: 50,
			TELLO_CMD_SET_EV: 52,
			TELLO_CMD_DATE_TIME: 70,
			TELLO_CMD_STICK: 80,
			TELLO_CMD_LOG_HEADER_WRITE: 4176,
			TELLO_CMD_LOG_DATA_WRITE: 4177,
			TELLO_CMD_LOG_CONFIGURATION: 4178,
			TELLO_CMD_WIFI_SIGNAL: 26,
			TELLO_CMD_VIDEO_BIT_RATE: 40,
			TELLO_CMD_LIGHT_STRENGTH: 53,
			TELLO_CMD_VERSION_STRING: 69,
			TELLO_CMD_ACTIVATION_TIME: 71,
			TELLO_CMD_LOADER_VERSION: 73,
			TELLO_CMD_STATUS: 86,
			TELLO_CMD_ALT_LIMIT: 4182,
			TELLO_CMD_LOW_BATT_THRESHOLD: 4183,
			TELLO_CMD_ATT_ANGLE: 4185,
			TELLO_CMD_SET_JPEG_QUALITY: 55,
			TELLO_CMD_TAKEOFF: 84,
			TELLO_CMD_LANDING: 85,
			TELLO_CMD_SET_ALT_LIMIT: 88,
			TELLO_CMD_FLIP: 92,
			TELLO_CMD_THROW_FLY: 93,
			TELLO_CMD_PALM_LANDING: 94,
			TELLO_CMD_PLANE_CALIBRATION: 4180,
			TELLO_CMD_SET_LOW_BATTERY_THRESHOLD: 4181,
			TELLO_CMD_SET_ATTITUDE_ANGLE: 4184,
			TELLO_CMD_ERROR1: 67,
			TELLO_CMD_ERROR2: 68,
			TELLO_CMD_FILE_SIZE: 98,
			TELLO_CMD_FILE_DATA: 99,
			TELLO_CMD_FILE_COMPLETE: 100,
			TELLO_CMD_HANDLE_IMU_ANGLE: 90,
			TELLO_CMD_SET_VIDEO_BIT_RATE: 32,
			TELLO_CMD_SET_DYN_ADJ_RATE: 33,
			TELLO_CMD_SET_EIS: 36,
			TELLO_CMD_SMART_VIDEO_START: 128,
			TELLO_CMD_SMART_VIDEO_STATUS: 129,
			TELLO_CMD_BOUNCE: 4179
		},
		log: {
			SEPARATOR: 85,		// U symbol
			// Full log spec https://github.com/Kragrathea/TelloLib/blob/master/TelloLib/parsedRecSpecs.json
			LOGREC: {
				16: {
					NAME: "USONIC",
					length: 4,
					fields: {
						H: {
							offset: 0,
							type: this.TYPE.SHORT
						},
						FLAG: {
							offset: 2,
							type: this.TYPE.BYTE
						},
						CNT: {
							offset: 3,
							type: this.TYPE.BYTE
						}
					}
				},
				29: {
					NAME: "MVO",
					length: 80,
					fields: {
						VX: {
							offset: 2,
							type: this.TYPE.SHORT
						},
						VY: {
							offset: 4,
							type: this.TYPE.SHORT
						},
						VZ: {
							offset: 6,
							type: this.TYPE.SHORT
						},
						PX: {
							offset: 8,
							type: this.TYPE.FLOAT
						},
						PY: {
							offset: 12,
							type: this.TYPE.FLOAT
						},
						PZ: {
							offset: 16,
							type: this.TYPE.FLOAT
						},
						HEIGHT: {
							offset: 68,
							type: this.TYPE.FLOAT
						}
					}
				},
				2048: {
					NAME: "IMU",
					length: 120,
					postprocess: {
						ANGLE: {
							func: false,
						}
					},
					fields: {
						ACC_X: {
							offset: 20,
							type: this.TYPE.FLOAT
						},
						ACC_Y: {
							offset: 24,
							type: this.TYPE.FLOAT
						},
						ACC_Z: {
							offset: 28,
							type: this.TYPE.FLOAT
						},
						GYRO_X: {
							offset: 32,
							type: this.TYPE.FLOAT
						},
						GYRO_Y: {
							offset: 36,
							type: this.TYPE.FLOAT
						},
						GYRO_Z: {
							offset: 40,
							type: this.TYPE.FLOAT
						},
						PRESS: {
							offset: 44,
							type: this.TYPE.FLOAT
						},
						Q_W: {
							offset: 48,
							type: this.TYPE.FLOAT
						},
						Q_X: {
							offset: 52,
							type: this.TYPE.FLOAT
						},
						Q_Y: {
							offset: 56,
							type: this.TYPE.FLOAT
						},
						Q_Z: {
							offset: 60,
							type: this.TYPE.FLOAT
						},
						ag_x: {
							offset: 64,
							type: this.TYPE.FLOAT
						},
						ag_y: {
							offset: 68,
							type: this.TYPE.FLOAT
						},
						ag_z: {
							offset: 72,
							type: this.TYPE.FLOAT
						},
						vg_x: {
							offset: 76,
							type: this.TYPE.FLOAT
						},
						vg_y: {
							offset: 80,
							type: this.TYPE.FLOAT
						},
						vg_z: {
							offset: 84,
							type: this.TYPE.FLOAT
						},
						gb_x: {
							offset: 88,
							type: this.TYPE.FLOAT
						},
						gb_y: {
							offset: 92,
							type: this.TYPE.FLOAT
						},
						gb_z: {
							offset: 96,
							type: this.TYPE.FLOAT
						},
						m_x: {
							offset: 100,
							type: this.TYPE.SHORT
						},
						m_y: {
							offset: 102,
							type: this.TYPE.SHORT
						},
						m_z: {
							offset: 104,
							type: this.TYPE.SHORT
						},
						temp_x: {
							offset: 106,
							type: this.TYPE.SHORT
						},
						temp_y: {
							offset: 108,
							type: this.TYPE.SHORT
						},
						temp_z: {
							offset: 110,
							type: this.TYPE.SHORT
						},
					}
				},
			}
		},
		smart_video: {
			TELLO_SMART_VIDEO_STOP: 0x00,
			TELLO_SMART_VIDEO_START: 0x01,
			TELLO_SMART_VIDEO_360: 0x01,
			TELLO_SMART_VIDEO_CIRCLE: 0x02,
			TELLO_SMART_VIDEO_UP_OUT: 0x03,
		},
		TBL_CRC16: [
			0x0000, 0x1189, 0x2312, 0x329b, 0x4624, 0x57ad, 0x6536, 0x74bf, 0x8c48, 0x9dc1, 0xaf5a, 0xbed3, 0xca6c, 0xdbe5, 0xe97e, 0xf8f7,
			0x1081, 0x0108, 0x3393, 0x221a, 0x56a5, 0x472c, 0x75b7, 0x643e, 0x9cc9, 0x8d40, 0xbfdb, 0xae52, 0xdaed, 0xcb64, 0xf9ff, 0xe876,
			0x2102, 0x308b, 0x0210, 0x1399, 0x6726, 0x76af, 0x4434, 0x55bd, 0xad4a, 0xbcc3, 0x8e58, 0x9fd1, 0xeb6e, 0xfae7, 0xc87c, 0xd9f5,
			0x3183, 0x200a, 0x1291, 0x0318, 0x77a7, 0x662e, 0x54b5, 0x453c, 0xbdcb, 0xac42, 0x9ed9, 0x8f50, 0xfbef, 0xea66, 0xd8fd, 0xc974,
			0x4204, 0x538d, 0x6116, 0x709f, 0x0420, 0x15a9, 0x2732, 0x36bb, 0xce4c, 0xdfc5, 0xed5e, 0xfcd7, 0x8868, 0x99e1, 0xab7a, 0xbaf3,
			0x5285, 0x430c, 0x7197, 0x601e, 0x14a1, 0x0528, 0x37b3, 0x263a, 0xdecd, 0xcf44, 0xfddf, 0xec56, 0x98e9, 0x8960, 0xbbfb, 0xaa72,
			0x6306, 0x728f, 0x4014, 0x519d, 0x2522, 0x34ab, 0x0630, 0x17b9, 0xef4e, 0xfec7, 0xcc5c, 0xddd5, 0xa96a, 0xb8e3, 0x8a78, 0x9bf1,
			0x7387, 0x620e, 0x5095, 0x411c, 0x35a3, 0x242a, 0x16b1, 0x0738, 0xffcf, 0xee46, 0xdcdd, 0xcd54, 0xb9eb, 0xa862, 0x9af9, 0x8b70,
			0x8408, 0x9581, 0xa71a, 0xb693, 0xc22c, 0xd3a5, 0xe13e, 0xf0b7, 0x0840, 0x19c9, 0x2b52, 0x3adb, 0x4e64, 0x5fed, 0x6d76, 0x7cff,
			0x9489, 0x8500, 0xb79b, 0xa612, 0xd2ad, 0xc324, 0xf1bf, 0xe036, 0x18c1, 0x0948, 0x3bd3, 0x2a5a, 0x5ee5, 0x4f6c, 0x7df7, 0x6c7e,
			0xa50a, 0xb483, 0x8618, 0x9791, 0xe32e, 0xf2a7, 0xc03c, 0xd1b5, 0x2942, 0x38cb, 0x0a50, 0x1bd9, 0x6f66, 0x7eef, 0x4c74, 0x5dfd,
			0xb58b, 0xa402, 0x9699, 0x8710, 0xf3af, 0xe226, 0xd0bd, 0xc134, 0x39c3, 0x284a, 0x1ad1, 0x0b58, 0x7fe7, 0x6e6e, 0x5cf5, 0x4d7c,
			0xc60c, 0xd785, 0xe51e, 0xf497, 0x8028, 0x91a1, 0xa33a, 0xb2b3, 0x4a44, 0x5bcd, 0x6956, 0x78df, 0x0c60, 0x1de9, 0x2f72, 0x3efb,
			0xd68d, 0xc704, 0xf59f, 0xe416, 0x90a9, 0x8120, 0xb3bb, 0xa232, 0x5ac5, 0x4b4c, 0x79d7, 0x685e, 0x1ce1, 0x0d68, 0x3ff3, 0x2e7a,
			0xe70e, 0xf687, 0xc41c, 0xd595, 0xa12a, 0xb0a3, 0x8238, 0x93b1, 0x6b46, 0x7acf, 0x4854, 0x59dd, 0x2d62, 0x3ceb, 0x0e70, 0x1ff9,
			0xf78f, 0xe606, 0xd49d, 0xc514, 0xb1ab, 0xa022, 0x92b9, 0x8330, 0x7bc7, 0x6a4e, 0x58d5, 0x495c, 0x3de3, 0x2c6a, 0x1ef1, 0x0f78
		],
		TBL_CRC8: [
			0x00, 0x5e, 0xbc, 0xe2, 0x61, 0x3f, 0xdd, 0x83, 0xc2, 0x9c, 0x7e, 0x20, 0xa3, 0xfd, 0x1f, 0x41,
			0x9d, 0xc3, 0x21, 0x7f, 0xfc, 0xa2, 0x40, 0x1e, 0x5f, 0x01, 0xe3, 0xbd, 0x3e, 0x60, 0x82, 0xdc,
			0x23, 0x7d, 0x9f, 0xc1, 0x42, 0x1c, 0xfe, 0xa0, 0xe1, 0xbf, 0x5d, 0x03, 0x80, 0xde, 0x3c, 0x62,
			0xbe, 0xe0, 0x02, 0x5c, 0xdf, 0x81, 0x63, 0x3d, 0x7c, 0x22, 0xc0, 0x9e, 0x1d, 0x43, 0xa1, 0xff,
			0x46, 0x18, 0xfa, 0xa4, 0x27, 0x79, 0x9b, 0xc5, 0x84, 0xda, 0x38, 0x66, 0xe5, 0xbb, 0x59, 0x07,
			0xdb, 0x85, 0x67, 0x39, 0xba, 0xe4, 0x06, 0x58, 0x19, 0x47, 0xa5, 0xfb, 0x78, 0x26, 0xc4, 0x9a,
			0x65, 0x3b, 0xd9, 0x87, 0x04, 0x5a, 0xb8, 0xe6, 0xa7, 0xf9, 0x1b, 0x45, 0xc6, 0x98, 0x7a, 0x24,
			0xf8, 0xa6, 0x44, 0x1a, 0x99, 0xc7, 0x25, 0x7b, 0x3a, 0x64, 0x86, 0xd8, 0x5b, 0x05, 0xe7, 0xb9,
			0x8c, 0xd2, 0x30, 0x6e, 0xed, 0xb3, 0x51, 0x0f, 0x4e, 0x10, 0xf2, 0xac, 0x2f, 0x71, 0x93, 0xcd,
			0x11, 0x4f, 0xad, 0xf3, 0x70, 0x2e, 0xcc, 0x92, 0xd3, 0x8d, 0x6f, 0x31, 0xb2, 0xec, 0x0e, 0x50,
			0xaf, 0xf1, 0x13, 0x4d, 0xce, 0x90, 0x72, 0x2c, 0x6d, 0x33, 0xd1, 0x8f, 0x0c, 0x52, 0xb0, 0xee,
			0x32, 0x6c, 0x8e, 0xd0, 0x53, 0x0d, 0xef, 0xb1, 0xf0, 0xae, 0x4c, 0x12, 0x91, 0xcf, 0x2d, 0x73,
			0xca, 0x94, 0x76, 0x28, 0xab, 0xf5, 0x17, 0x49, 0x08, 0x56, 0xb4, 0xea, 0x69, 0x37, 0xd5, 0x8b,
			0x57, 0x09, 0xeb, 0xb5, 0x36, 0x68, 0x8a, 0xd4, 0x95, 0xcb, 0x29, 0x77, 0xf4, 0xaa, 0x48, 0x16,
			0xe9, 0xb7, 0x55, 0x0b, 0x88, 0xd6, 0x34, 0x6a, 0x2b, 0x75, 0x97, 0xc9, 0x4a, 0x14, 0xf6, 0xa8,
			0x74, 0x2a, 0xc8, 0x96, 0x15, 0x4b, 0xa9, 0xf7, 0xb6, 0xe8, 0x0a, 0x54, 0xd7, 0x89, 0x6b, 0x35,
		]
	}


	this.seqID = 0;

	this.stickData = {
			roll     : 0,
			pitch    : 0,
			throttle : 0,
			yaw      : 0,
			fast:0
		};
	/*
		stick data is float -1,+1
		MODE 2
		
		   throlle (lY)           pitch (Ry)
		   |                      |
		---+--- yaw (lX)       ---+--- roll (Rx)
		   |                      |
	
	
	*/
	this.rcCtr = 0;
	this.statusCtr = 0;
	this.video_stream_file = false;
	this.failsafe = 0;
	this.armed = false;

	this._calcCRC16 = function (buf, size) {
		var i = 0
		var seed = 0x3692
		while (size > 0) {
			seed = this.tello.TBL_CRC16[(seed ^ buf[i]) & 0xff] ^ (seed >> 8)
			i++
			size--
		};
		return seed
	}

	this._calcCRC8 = function (buf, size) {
		var i = 0
		var seed = 0x77
		while (size > 0) {
			seed = this.tello.TBL_CRC8[(seed ^ buf[i]) & 0xff]
			i++
			size--
		}
		return seed
	}

	this._buildPacket = function (pacType, cmdID, seq, data, data_len) {
		var size = 11 + (data_len?data_len:(data?data.length:0));
		var bb = Buffer.alloc(size)
		bb.writeUInt8(0xCC,0)
		bb.writeUInt16LE(size << 3,1)
		var crc8 = this._calcCRC8([...bb], 3)
		bb.writeUInt8(crc8,3);
		bb.writeUInt8(pacType,4);
		bb.writeUInt16LE(cmdID,5);
		bb.writeUInt16LE(seq,7);
		if (data && !data_len) {
			if (Buffer.isBuffer(data)) {
				// TODO all should be buffer!!!
				data.copy(bb, 9);
			} else {
				bb.write(data,9);
			}
		} else if (data) {
			for (var i=0; i<data_len; i++) {
				bb[9 + i] = data[i];
			}
		}
		var crc16 = this._calcCRC16([...bb], size - 2);
		bb.writeUInt16LE(crc16, size-2)
		return bb
	}

	this._parsePacket = function(bb) {
		var dataSize = 0;
		var cmdID    = 0;

		if (bb.length >= 11) {
			var mark = bb.readUInt8(0);
			if (mark == 0xCC) {	// start of packet
				var size = bb.readUInt16LE(1) >> 3;
				var crc8 = bb.readUInt8(3);
				var calcCRC8 = this._calcCRC8([...bb], 3);
				if (crc8 != calcCRC8) {
					console.log('wrong CRC8',crc8, calcCRC8);	// TODO error handler
				}
				var pacType   = bb.readUInt8(4);
				var cmdID     = bb.readUInt16LE(5);
				this.seqID    = bb.readUInt16LE(7);
				var dataSize  = size - 11;
				var data      = false;
				var crc16     = bb.readUInt16LE(size - 2);
				var calcCRC16 = this._calcCRC16([...bb], size - 2);
				if (crc16 != calcCRC16) {
					console.log ('wrong CRC16', crc16, calcCRC16);	// TODO error handler
				}
				//console.log("package", mark, pacType, cmdID, dataSize);
				if (cmdID == this.tello.commands.TELLO_CMD_WIFI_SIGNAL) {
					this.status.wifi.signal = bb.readUInt8(9);
					this.status.wifi.interference = bb.readUInt8(10);
					
				} else if (cmdID == this.tello.commands.TELLO_CMD_LIGHT_STRENGTH) {
					this.status.light = bb.readUInt8(9);
					
				} else if (cmdID == this.tello.commands.TELLO_CMD_STATUS) {
					this.parseStatus(bb);

				} else if (cmdID == this.tello.commands.TELLO_CMD_LOG_HEADER_WRITE) {	// log header, we need request log
					var payload = Buffer.alloc(3);
						payload[1]=bb[9];
						payload[2]=bb[10];
					this._sendCmd(0x50, this.tello.commands.TELLO_CMD_LOG_HEADER_WRITE, payload, 3);
					
				} else if (cmdID == this.tello.commands.TELLO_CMD_LOG_DATA_WRITE) {
					try {
						this.parseLog (bb, size);
					} catch (e) {
							console.log("Log parse error", e, bb, size);
						}
					
				} else {
					console.log("DBG", "unknown CMD", cmdID);
				}
			} else {
				if (mark == 0x63) {
					var ack = Buffer.alloc(11);
					ack.write('conn_ack:');
					ack.writeUInt16LE(this.tello.video.port,9);
					if (ack.toString() == bb.toString()) {
						cmdID = this.tello.commands.TELLO_CMD_CONN_ACK;
						this.initVideo();
					} else {
						console.log('wrong video port !!', ack, bb);	// TODO error handler
					}
				} else {
					console.log ('wrong mark !! ', mark);	// TODO error handler
				}
			}
		} else {
			console.log('wrong packet', bb);
		}
		return cmdID
	}
	
	this._b = function (b) {
		return  parseInt(b, 10).toString(2);
	}

	this._sendCmd = function(pacType, cmdID, data, data_len) {
		var bb      = false
		var pp      = false
		var payload = false
		var out     = false
		var seq     = 0
		var len     = 0
		var ts      = new Date();

		if (cmdID == this.tello.commands.TELLO_CMD_CONN) {
			out = Buffer.alloc(11)
			out.write('conn_req:')
			out.writeUInt16LE(this.tello.video.port,9);
			this.seqID++
		} else if (cmdID == this.tello.commands.TELLO_CMD_STICK) {
			// https://github.com/hanyazou/TelloPy/blob/develop-0.6.0/tellopy/_internal/tello.py
			bb = Buffer.alloc(11)
			
			// TODO... this string manipulation is soooo slow!
			var tmp_roll     = "00000000000"+(parseInt(1024 + 660 * this.stickData.roll) & 0x07ff).toString(2); tmp_roll=tmp_roll.substr(-11);
			var tmp_pitch    = "00000000000"+(parseInt(1024 + 660 * this.stickData.pitch) & 0x07ff).toString(2); tmp_pitch=tmp_pitch.substr(-11);
			var tmp_throttle = "00000000000"+(parseInt(1024 + 660 * this.stickData.throttle) & 0x07ff).toString(2); tmp_throttle=tmp_throttle.substr(-11);
			var tmp_yaw      = "00000000000"+(parseInt(1024 + 660 * this.stickData.yaw) & 0x07ff).toString(2); tmp_yaw=tmp_yaw.substr(-11);
			//var tmp_boost    = "00000000000"+(parseInt(1024 + 660 * 0)).toString(2);
			
			// well... JS is 32 bit only and for this thing we need 64bit (11*4 bit + 4 more for 48bit value)... lets do this as strings
			// !!!!string should be 48bits (chars)!!!!
			var rc = "0000"+tmp_yaw.toString(2)+tmp_throttle.toString(2)+tmp_pitch.toString(2)+tmp_roll.toString(2);

			bb.writeUInt8(parseInt(rc.substr( -8,8),2), 0);
			bb.writeUInt8(parseInt(rc.substr(-16,8),2), 1);
			bb.writeUInt8(parseInt(rc.substr(-24,8),2), 2);
			bb.writeUInt8(parseInt(rc.substr(-32,8),2), 3);
			bb.writeUInt8(parseInt(rc.substr(-40,8),2), 4);
			bb.writeUInt8(parseInt(rc.substr(-48,8),2), 5);

			bb.writeUInt8(ts.getHours(),6);
			bb.writeUInt8(ts.getMinutes(),7);
			bb.writeUInt8(ts.getSeconds(),8);
			bb.writeUInt16LE(ts.getMilliseconds()*1000 & 0xffff,9);
			console.log("DBG",  [tmp_roll.length, tmp_pitch.length, tmp_throttle.length, tmp_yaw.length], rc, rc.length, bb);
			//console.log("DBG", rc, '=>', rc.substr(-48,8), rc.substr(-40,8), rc.substr(-32,8), rc.substr(-24,8), rc.substr(-16,8), rc.substr(-8,8));
			seq = 0

		} else if (cmdID == this.tello.commands.TELLO_CMD_DATE_TIME) {
			seq = parseInt(this.seqID)
			bb = Buffer.alloc(15)
			bb.writeUInt8(0x00,0)
			bb.writeUInt16LE(ts.getYear(),1)
			bb.writeUInt16LE(ts.getMonth(),3)
			bb.writeUInt16LE(ts.getDay(),5)
			bb.writeUInt16LE(ts.getHours(),7)
			bb.writeUInt16LE(ts.getMinutes(),9)
			bb.writeUInt16LE(ts.getSeconds(),11)
			bb.writeUInt16LE(ts.getMilliseconds()*1000 & 0xffff,13)
			this.seqID++
		} else if (cmdID == this.tello.commands.TELLO_CMD_REQ_VIDEO_SPS_PPS) {
			seq = 0
		} else {
			seq = parseInt(this.seqID)
			this.seqID++
		}
		
		if (bb) {
			payload = bb;
		} else {
			payload = data;
		}

		if (!out) out = this._buildPacket(pacType, cmdID, seq, payload, data_len)

		/*if (cmdID != this.tello.commands.TELLO_CMD_STICK) {
			console.log("SEND:", cmdID, bb, payload.length, out);	// TODO DEBUG handler
		}*/
		this.tello_control.send(out,0,out.length, this.tello.control.port, this.tello.control.host, function(err, bytes) {
			// TODO error handler
			//if (err) throw err;
			//console.log('UDP message sent', bytes,err);
			//client.close();)
		});
	}

	this._cmdRX =function (msg, addr) {
		var data = Buffer.from(msg);
		var payload = false;

		var size = msg.length;

		var cmdID   = this._parsePacket(data);
		//console.log("command = ", cmdID);
		var payload = data.slice(9,size);

		if (cmdID == this.tello.commands.TELLO_CMD_CONN_ACK) {
			console.log("TELLO_CMD_CONN_ACK")
			console.log('Connection successful!');
		} else if (cmdID == this.tello.commands.TELLO_CMD_DATE_TIME) {
			console.log("TELLO_CMD_DATE_TIME")
			this._sendCmd(0x50, this.tello.commands.TELLO_CMD_DATE_TIME, false)
		} else if (cmdID == this.tello.commands.TELLO_CMD_STATUS) {
			//console.log("TELLO_CMD_STATUS", this.statusCtr);
			if (this.statusCtr == 3) {
				this._sendCmd(0x60, this.tello.commands.TELLO_CMD_REQ_VIDEO_SPS_PPS, false)
				this._sendCmd(0x48, this.tello.commands.TELLO_CMD_VERSION_STRING, false)
				this._sendCmd(0x48, this.tello.commands.TELLO_CMD_SET_VIDEO_BIT_RATE, false)
				this._sendCmd(0x48, this.tello.commands.TELLO_CMD_ALT_LIMIT, false)
				this._sendCmd(0x48, this.tello.commands.TELLO_CMD_LOW_BATT_THRESHOLD, false)
				this._sendCmd(0x48, this.tello.commands.TELLO_CMD_ATT_ANGLE, false)
				this._sendCmd(0x48, this.tello.commands.TELLO_CMD_REGION, false)
				this._sendCmd(0x48, this.tello.commands.TELLO_CMD_SET_EV, 0x00,1);
			}
			this.statusCtr++
		} else if (cmdID == this.tello.commands.TELLO_CMD_VERSION_STRING) {
			console.log("TELLO_CMD_VERSION_STRING")
			if (size >= 42) {
				this.status.version = data.slice(10,30).toString();
				console.log ('Version:', this.status.version);
			}
		} else if (cmdID == this.tello.commands.TELLO_CMD_SMART_VIDEO_START) {
			console.log("TELLO_CMD_SMART_VIDEO_START")
			if (payload.length > 0) {
				console.log('smart video start');
			}
		} else if (cmdID == this.tello.commands.TELLO_CMD_ALT_LIMIT) {
			console.log("TELLO_CMD_ALT_LIMIT")
			if (payload.length > 0) {
				//payload.get_ULInt8()                    # 0x00
				this.status.altitude.max = payload.readUInt16LE(1)
				console.log ('Altitude limit:',this.status.altitude.max, 'meters');

				// TODO
				//if height != self.NEW_ALT_LIMIT:
				//    print 'set new alt limit : {0:2d} meter'.format(self.NEW_ALT_LIMIT)
				//    self._sendCmd(0x68, self.TELLO_CMD_SET_ALT_LIMIT, bytearray([self.NEW_ALT_LIMIT & 0xff, (self.NEW_ALT_LIMIT >> 8) & 0xff]));
			}

		} else if (cmdID == this.tello.commands.TELLO_CMD_SMART_VIDEO_STATUS) {
			console.log("TELLO_CMD_SMART_VIDEO_STATUS")
			if (payload.length > 0) {
				var resp = payload.readUInt8()
				var dummy = resp & 0x07
				var start = (resp >> 3) & 0x03
				var mode  = (resp >> 5) & 0x07
				console.log ('smart video status - mode:, start:', mode, start);
				this._sendCmd(0x50, this.tello.commands.TELLO_CMD_SMART_VIDEO_STATUS, 0x00);
			}
		}
	}


	this._timerTask = function() {
		this._sendCmd(0x60, this.tello.commands.TELLO_CMD_STICK, false);
		this.rcCtr++;
		
		// every 0.5 seconds increase failsafe value
		if (this.rcCtr % 25 == 0) {
			this.failsafe++;
		}
		
		if (this.failsafe>2) {
			// no data more than 0.5*2 seconds, set failsafe
			if (this.armed == true) {
				console.log("FAILSAFE!!!")
				this.tello_cmd({cmd: { cmd: "land", value: 0 }});
			}
			// set sticks data to default (middle)
			this.stickData = {
				roll     : 0,
				pitch    : 0,
				throttle : 0,
				yaw      : 0,
				fast:0
			};

		}

		//every 1sec as this task run every 20ms, so 50*20 = 1000 = 1 sec
		if (this.rcCtr % 50 == 0) {
			this._sendCmd(0x60, this.tello.commands.TELLO_CMD_REQ_VIDEO_SPS_PPS, false)
		}
	}
	
	
	this.tello_cmd = function (data) {
		// JSON with command
		/*
			{
				cmd: {
						cmd:     "photo" | "ev"        | "quality.photo",
						value:    ???    |  see below  |  ???
					}
			}
			
			EV:
			-3.0, -2.7, -2.3, -2.0, -1.7, -1.3, -1.0, -0.7, -0.3, 0, 0.3, 0.7, 1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0
		*/
		//console.log("TELLO_CMD:", data);
			if (data.cmd.cmd == 'ev') {
				console.log("TELLO_CMD SET_EV:", this.EV[data.cmd.value]);
				var payload = Buffer.alloc(1);
					payload[0]=this.EV[data.cmd.value];
				this._sendCmd(0x48, this.tello.commands.TELLO_CMD_SET_EV, payload, 1);
			}
			if (data.cmd.cmd == 'takeoff') {
				this.armed = true;	// TODO check logs insted of this, NOT SAFE!!!
				console.log("TELLO_CMD_TAKEOFF");
				this._sendCmd(0x68, this.tello.commands.TELLO_CMD_TAKEOFF, false);
			}
			if (data.cmd.cmd == 'land') {
				this.armed = false;	// TODO check logs insted of this, NOT SAFE!!!
				console.log("TELLO_CMD_LANDING");
				var payload = Buffer.alloc(1);
					payload[0]=0;
				this._sendCmd(0x68, this.tello.commands.TELLO_CMD_LANDING, payload, 1);
			}
			if (data.cmd.cmd == 'stick') {
				this.stickData.roll = data.cmd.value.roll; if (this.stickData.roll>1 || this.stickData.roll<-1) this.stickData.roll = 0;
				this.stickData.pitch = data.cmd.value.pitch; if (this.stickData.pitch>1 || this.stickData.pitch<-1) this.stickData.pitch = 0;
				this.stickData.throttle = data.cmd.value.throttle; if (this.stickData.throttle>1 || this.stickData.throttle<-1) this.stickData.throttle = 0;
				this.stickData.yaw = data.cmd.value.yaw; if (this.stickData.yaw>1 || this.stickData.yaw<-1) this.stickData.yaw = 0;
			}
			
			if (data.cmd.cmd == 'ping') {
				this.failsafe = 0;
			}
	}


	this.init = function () {

		if (this.save_video_path!==false) {
			this.video_stream_file = fs.createWriteStream(this.save_video_path+"/"+((new Date()).getTime())+'.video.h264');
		}

		this.tello_control.on('error', function (err){
			console.log(`tello_control error:\n${err.stack}`);
			this.tello_control.close();
		}.bind(this));

		this.tello_control.on('message', function (msg, rinfo) {
			this._cmdRX(msg,rinfo);
		}.bind(this));

		this.tello_control.on('listening', function () {
			var tello_address = this.tello_control.address();
			console.log(`tello_control listening ${tello_address.address}:${tello_address.port}`);
		}.bind(this));

		this._sendCmd(0, this.tello.commands.TELLO_CMD_CONN);

		setInterval(function () { this._timerTask(); }.bind(this),20);

		this.tello_video.on('error', function (err) {
			console.log(`tello_video error:\n${err.stack}`);
			setTimeout(function() { this.initVideo(); }.bind(this),1000);
		}.bind(this));

		this.tello_video.on('message', function (msg, rinfo) {
			if (this.save_video_path!==false) {
				this.video_stream_file.write(msg.slice(2));
			}
			if (this.tello_video_output!=false) {
				this.tello_video_output(msg.slice(2));	// video feed callback
			}
		}.bind(this));

		this.tello_video.on('listening', function () {
			var tello_video_address = this.tello_video.address();
			console.log(`tello_video listening ${tello_video_address.address}:${tello_video_address.port}`);
		}.bind(this));
	}

	this.initVideo = function() {
		this.tello_video.bind(this.tello.video.port);
	}
	
	this.parseStatus = function (bb) {
		//flight data msg (https://github.com/hanyazou/TelloPy/blob/master/tellopy/_internal/protocol.py) 0x56
		// just skip first 9 bytes
		this.status.speed.vertical = bb.readInt16LE(9);
		this.status.speed.north = bb.readInt16LE(11);
		this.status.speed.east = bb.readInt16LE(13);
		this.status.speed.ground = bb.readInt16LE(15);
		this.status.fly_time.time = bb.readInt16LE(17);
		
		var tmp = bb.readInt8(19);
			this.status.state.imu.state = (tmp >> 0) & 0x1;
			this.status.state.pressure = (tmp >> 1) & 0x1;
			this.status.state.down_visual = (tmp >> 2) & 0x1;
			this.status.state.power = (tmp >> 3) & 0x1;
			this.status.state.battery.state = (tmp >> 4) & 0x1;
			this.status.state.gravity = (tmp >> 5) & 0x1;
			this.status.state.wind = (tmp >> 7) & 0x1;
		
		this.status.state.imu.calibration = bb.readInt8(20);
		this.status.state.battery.percentage = bb.readInt8(21);
		this.status.state.battery.left = bb.readInt16LE(22);
		this.status.state.battery.voltage = bb.readInt16LE(24);
			
		tmp = bb.readInt8(26);
			this.status.state.em.sky = (tmp >> 0) & 0x1;
			this.status.state.em.ground = (tmp >> 1) & 0x1;
			this.status.state.em.open = (tmp >> 2) & 0x1;
			this.status.state.drone_hover = (tmp >> 3) & 0x1;
			this.status.state.outage_recording = (tmp >> 4) & 0x1;
			this.status.state.battery.low = (tmp >> 5) & 0x1;
			this.status.state.battery.lower = (tmp >> 6) & 0x1;
			this.status.state.factory_mode = (tmp >> 7) & 0x1;
		
		this.status.state.fly_mode = bb.readInt8(27);
		this.status.state.throw_fly_timer = bb.readInt8(28);
		this.status.state.camera = bb.readInt8(29);
		this.status.state.em.state = bb.readInt8(30);
		
		tmp = bb.readInt8(31);
			this.status.state.front.in = (tmp >> 0) & 0x1;
			this.status.state.front.out = (tmp >> 1) & 0x1;
			this.status.state.front.lsc = (tmp >> 2) & 0x1;
		
		this.status.state.temperature_height = bb.readInt8(32);
		//console.log("state", this.status);
	}
	
	this.parseLog = function (bb, size) {
		// https://github.com/Kragrathea/TelloLib/blob/master/TelloLib/TelloLog.cs
		// https://github.com/SMerrony/tello/blob/master/flog.go
		var logPosition = 0;
		var logFieldName = "";
		var logObject = false;
		while (logPosition < (size-2)) {
			if (bb.readUInt8(logPosition) != this.tello.log.SEPARATOR) {
				logPosition++;
				continue;
			}
			var len = bb.readUInt8(logPosition + 1);	// TODO, could be: RangeError: Index out of range
			if (bb.readUInt8(logPosition + 2) != 0) {
				logPosition++;
				break;
			}
			var recSpecId = bb.readUInt16LE(logPosition + 4);
			var xorBuf = Buffer.alloc(256);
			var xorValue = bb[logPosition + 6];
			if (typeof this.tello.log.LOGREC[recSpecId] != 'undefined') {
				//console.log("DBG", " found:", this.tello.log.LOGREC[recSpecId].NAME);
				for (var i = 0; i < len; i++) {	// Decrypt payload
					xorBuf[i] = (bb[logPosition + i] ^ xorValue);
				}
				var baseOffset = 10;
				for (var i in this.tello.log.LOGREC[recSpecId].fields) { if (typeof this.tello.log.LOGREC[recSpecId].fields[i] == 'object') {
					logObject = this.tello.log.LOGREC[recSpecId].fields[i];
					logFieldName = this.tello.log.LOGREC[recSpecId].NAME+"."+i;
					switch (logObject.type) {
						case this.TYPE.FLOAT:
							this.status[logFieldName] = xorBuf.readFloatLE(baseOffset + logObject.offset);
							break;
						case this.TYPE.SHORT:
							this.status[logFieldName] = xorBuf.readInt16LE(baseOffset + logObject.offset);
							break;
						case this.TYPE.BYTE:
							this.status[logFieldName] = xorBuf[baseOffset + logObject.offset];
							break;
						default:
							console.log("DBG", "unknown type", logObject.type);
					}
				}}
				if (typeof this.tello.log.LOGREC[recSpecId].postprocess == 'object') {
					for (var i in this.tello.log.LOGREC[recSpecId].postprocess) {
						if (typeof this.tello.log.LOGREC[recSpecId].postprocess[i].func == 'function') {
							this.tello.log.LOGREC[recSpecId].postprocess[i].func();
						}
					}
				}
				//console.log("STATUS:", this.status);
				this.sendLog();
			} else {
				//console.log("DBG", "unknown log type", recSpecId, "datasize = ", dataSize);
			}
			logPosition += len;
		}
	}
	this.sendLog = function () {
		// prepare telemetry output based on configuration
		var output = {};
		if (this.tello_telemetry_config !== false) {
			for (var i in this.tello_telemetry_config) {
				if (typeof this.status[this.tello_telemetry_config[i]] != 'undefined') {
					output[i] = this.status[this.tello_telemetry_config[i]];
				}
			}
			this.tello_telemetry_output(JSON.stringify(output));
		}
	}
	
	this.QtoDeg = function () {
		// https://github.com/SMerrony/tello/blob/master/flog.go
		try {
		var sqX = Math.pow(this.status['IMU.Q_X'],2);
		var sqY = Math.pow(this.status['IMU.Q_Y'],2);
		var sqZ = Math.pow(this.status['IMU.Q_Z'],2);
		
		var sinR = 2 * (this.status['IMU.Q_W'] * this.status['IMU.Q_X'] + this.status['IMU.Q_Y'] * this.status['IMU.Q_Z']);
		var cosR = 1 - 2 * (sqX + sqY);
		this.status['IMU.ANGLE_ROLL'] = parseFloat(Math.atan2(sinR, cosR) / this.DEG);
		
		var sinP = 2 * (this.status['IMU.Q_W'] * this.status['IMU.Q_Y'] - this.status['IMU.Q_Z'] * this.status['IMU.Q_X']);
		if (sinP > 1) {
			sinP = 1;
		} else if (sinP < -1) {
			sinP = -1;
		}
		this.status['IMU.ANGLE_PITCH'] = parseFloat(Math.asin(sinP) / this.DEG);
		
		var sinY = 2 * (this.status['IMU.Q_W'] * this.status['IMU.Q_Z'] + this.status['IMU.Q_X'] * this.status['IMU.Q_Y']);
		var cosY = 1 - 2 * (sqY + sqZ);
		this.status['IMU.ANGLE_YAW'] = parseFloat(Math.atan2(sinY, cosY) / this.DEG);
		}  catch (e) {
			console.log("ERROR","QtoDeg", e);
		}
	}
	this.tello.log.LOGREC[2048].postprocess.ANGLE.func = function () { this.QtoDeg(); }.bind(this);
}

module.exports = nodetello;
