/* global Core */
var BinaryReader = BinaryReader || Core.BinaryReader;

var RECT = (function () {
	function RECT(x, y, w, h) {
	    this.x = x;
	    this.y = y;
	    this.w = w;
	    this.h = h;
	}
	
	return RECT;
})();

var TIM_IMAGE =(function () {
	TIM_IMAGE.TIM_4BPP = 8;
	TIM_IMAGE.TIM_8BPP = 9;
	TIM_IMAGE.TIM_16BPP = 2;
	TIM_IMAGE.TIM_24BPP = 3;
    TIM_IMAGE.TIM_MAGICK = 0x10;

	function TIM_IMAGE() {
		this.abr = undefined;
        this.mode = undefined;
        this.crect = undefined;
        this.caddr = undefined;
        this.prect = undefined;
        this.paddr = undefined;
	}    

	return TIM_IMAGE;
})();

var VRAM = (function () {
    VRAM.WIDTH = 1024;
    VRAM.HEIGHT = 512;
    VRAM.DATA_LENGTH = 1024 * 512 * 2;
    
	function VRAM() {
	    this.data = new Uint16Array(VRAM.DATA_LENGTH);
	}
	
	VRAM.prototype.clear = function() {
		this.data = new Uint16Array(VRAM.DATA_LENGTH);
	};
	
	VRAM.prototype.loadImage2 = function(tpage, clut, tw) {
		
		tpage = {
			mode: ((tpage)>>7)&0x003,
			abr: ((tpage)>>5)&0x003,
			x: ((tpage)<<6)&0x7c0 % 1024,
			y: ((((tpage)<<4)&0x100)+(((tpage)>>2)&0x200)),
		};
		tpage.w = 256; //tpage.mode == 0 ? 64 : ( tpage.mode == 1 ? 128 : 256 );
		tpage.h = 256;
		
		tw = {
			x: tw && tw.x ? tw.x + tpage.x : tpage.x,
			y: tw && tw.y ? tw.y + tpage.y : tpage.y,
			w: tw && tw.w ? tw.w : tpage.w,
			h: tw && tw.h ? tw.h : tpage.h
		};
		
		if( tpage.mode < 2 ) { // 4bit || 8bit
			clut = {
				x: (clut&0x3f)<<4,
				y: (clut>>6),
				size: tpage.mode == 0 ? 16 : 256
			};
			clut.data = this.data.subarray(this.addr(clut.x, clut.y), this.addr(clut.x, clut.y) + clut.size);
		}
		
		var image = {
				w: tw.w,
				h: tw.h,
				data: new Uint16Array( tw.w * tw.h )
			},
			addr, index, 
			dw = tw.w / (tpage.mode == 0 ? 4 : ( tpage.mode == 1 ? 2 : 1 ));

		for(var dy=0; dy < tw.h; dy++) {
			for(var dx=0; dx < dw; dx++) {
				addr = this.addr(tw.x + dx, tw.y + dy);
				
				switch (tpage.mode) {
					case 0: // 4bit
					case 1: // 8bit
						var textels = new Uint8Array(new Uint16Array(this.data.subarray(addr, addr + 1)).buffer);
						
						if( tpage.mode === 0 ) {
							index = (dx * 4 + dy * image.w);
							
							image.data[ index ] = clut.data[ (textels[0] & 0x0F) ];
							image.data[ index + 1 ] = clut.data[ (textels[0] >> 4) ];
							image.data[ index + 2 ] = clut.data[ (textels[1] & 0x0F) ];
							image.data[ index + 3 ] = clut.data[ (textels[1] >> 4) ];
						} else {
							index = (dx * 2 + dy * image.w);
							
							image.data[ index ] = clut.data[ textels[0] ];
							image.data[ index + 1 ] = clut.data[ textels[1] ];
						}
					break;
					case 2: // 16bit
						image.data[ dx + dy * image.w ] = this.data[ addr ];
						break;
				}
			}
		}
		
		return image;
	};
	
	VRAM.prototype.loadImageData2 = function(tpage, clut, tw) {
		var image = this.loadImage2(tpage, clut, tw);
		
		var imageData;
		
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext("2d");
		imageData = ctx.createImageData(image.w, image.h);
		
		for(var i =0; i < image.data.length; i++) {
		    var c = this.toRgba(image.data[i]),
		    	index = i * 4;
		    imageData.data[index] = c.r;
		    imageData.data[index + 1] = c.g;
		    imageData.data[index + 2] = c.b;
		    imageData.data[index + 3] = c.a;
		}
		
		return imageData;
	};
	
	VRAM.prototype.addr = function(x, y) {
		return x + y * VRAM.WIDTH;
	};
	
	VRAM.prototype.loadImage = function(tpage, clut, tx, ty) {
		
		tpage = {
			mode: ((tpage)>>7)&0x003,
			abr: ((tpage)>>5)&0x003,
			x: ((tpage)<<6)&0x7c0 % 1024,
			y: ((((tpage)<<4)&0x100)+(((tpage)>>2)&0x200)),
		};
		
		if ( tpage.mode === 0 ) {
			tx = tx / 4; // tx in 0x12 always refers to 8bit (w=128)?
		}
		
		var twin = new RECT(
			tpage.x + tx, 
			tpage.y + ty,
			//width
			tpage.mode == 0 ? 16 : (tpage.mode == 1 ? 64 : 256), // size in vram
			//height
			tpage.mode == 0 ? 64 : (tpage.mode == 1 ? 128 : 256) // real size
			);
			
		if( tpage.mode < 2 ) { // 4bit || 8bit
			clut = {
				x: (clut&0x3f)<<4,
				y: (clut>>6),
				size: tpage.mode == 0 ? 16 : 256
			};
			clut.data = this.data.subarray(clut.x + clut.y * VRAM.WIDTH, clut.x + clut.y * VRAM.WIDTH + clut.size);
		}
		// console.log(twin,clut);
		
		var image = {
			w: twin.h,
			h: twin.h,
			data: new Uint16Array(twin.h * twin.h)
		};
		
		var dataIndex = -1, index = -1;
		
		for(var dy=0; dy < twin.h; dy++) {
			for(var dx=0; dx < twin.w; dx++) {
				dataIndex = (twin.x + dx) + (twin.y + dy) * VRAM.WIDTH;
				
				switch (tpage.mode) {
					case 0: // 4bit
					case 1: // 8bit
						// code
						var indices = new Uint8Array(new Uint16Array(this.data.subarray(dataIndex, dataIndex + 1)).buffer);
						
						if( tpage.mode === 0 ) {
							index = (dx * 4 + dy * image.w);
							
							image.data[index] = clut.data[ (indices[0] & 0x0F) ];
							image.data[index + 1] = clut.data[ (indices[0] >> 4) ];
							image.data[index + 2] = clut.data[ (indices[1] & 0x0F) ];
							image.data[index + 3] = clut.data[ (indices[1] >> 4) ];
						} else {
							index = (dx * 2 + dy * image.w);
							
							image.data[index] = clut.data[indices[0]];
							image.data[index + 1] = clut.data[indices[1]];
						}
						break;
					case 2: // 16bit
						image.data[dx + dy * image.w] = this.data[dataIndex];
						break;
				}
			}
		}
		
		return image;
	};
	
	VRAM.prototype.loadImageData = function(tpage, clut, tx, ty) {
		var image = this.loadImage(tpage, clut, tx, ty);
		
		var imageData;
		
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext("2d");
		imageData = ctx.createImageData(image.w, image.h);
		
		for(var i =0; i < image.data.length; i++) {
		    var c = this.toRgba(image.data[i]);
		    imageData.data[i * 4] = c.r;
		    imageData.data[i * 4 + 1] = c.g;
		    imageData.data[i * 4 + 2] = c.b;
		    imageData.data[i * 4 + 3] = c.a;
		}
		
		return imageData;
	};
	
	VRAM.prototype.readTIM = function(timimg) {
	    var reader = new BinaryReader(timimg);
	    var tim = new TIM_IMAGE();
	    
	    if( reader.readUint32() !== TIM_IMAGE.TIM_MAGICK ) {
	    	console.warn('[VRAM] Wrong tim magick.');
	    }
	    
	    tim.mode = reader.readUint32();
	    
	    if( tim.mode >> 3 ) {
	    	//read clut
	    	var clength = reader.readUint32(); // Clut length [TODO: debug this]
	    	
	    	tim.crect = new RECT(
	    			reader.readUint16(), // x
	    			reader.readUint16(), // y
	    			reader.readUint16(), // w
	    			reader.readUint16()  // h
	    		);
	    	tim.caddr = tim.crect.x + tim.crect.y * VRAM.WIDTH;
	    	
	    	for(var cy = 0; cy < tim.crect.h; cy++) {
	    		for(var cx = 0; cx < tim.crect.w; cx++) {
	    			// STORE VALUE
	    			this.data[(tim.crect.x + cx) + (tim.crect.y + cy) * VRAM.WIDTH] = reader.readUint16();
	    		}
	    	}
	    }
	    
	    // read tim data
	    var plength = reader.readUint32(); // data length [TODO: debug this]
	    
    	tim.prect = new RECT(
    			reader.readUint16(), // x
    			reader.readUint16(), // y
    			reader.readUint16(), // w
    			reader.readUint16()  // h
    		);
    	tim.paddr = tim.prect.x + tim.prect.y * VRAM.WIDTH;
    	
    	var val;
    	for(var dy = 0; dy < tim.prect.h; dy++) {
    		for(var dx = 0; dx < tim.prect.w; dx++) {
    			// STORE VALUE
    			try {
    				val = reader.readUint16();
    			} catch(e){
    				val = 0;
				}
    			
    			this.data[(tim.prect.x + dx) + (tim.prect.y + dy) * VRAM.WIDTH] = val;//reader.readUint16();
    		}
    	}
    	
    	return tim;
	};
	
	VRAM.prototype.readSprite = function(sprt) {
		var reader = new BinaryReader(sprt);
		
		var pointer = reader.readUint32(),
			unknown = reader.readUint32();
		
		if( unknown != 0x24 ) {
			console.log('sprt 0x24!:', unknown, unknown.toString(16));
		}
		
		// read rest
		
		// seek to tpage/clut info
		reader.seek( pointer );
		
		var unknown1 = [ reader.readUint16(), reader.readUint16() ];
		
		var tim = new TIM_IMAGE();
		
		tim.abr = reader.readUint16();
		tim.mode = reader.readUint16();
		
		tim.prect = new RECT(
			reader.readUint16(), // x
			reader.readUint16(), // y
			reader.readUint16(), // w
			reader.readUint16()  // h
		);
		tim.paddr = tim.prect.x + tim.prect.y * VRAM.WIDTH;
		
		tim.crect = new RECT(
			reader.readUint16(), // x
			reader.readUint16(), // y
			reader.readUint16(), // w
			reader.readUint16()  // h
		);
		tim.caddr = tim.crect.x + tim.crect.y * VRAM.WIDTH;
		
		for(var cy = 0; cy < tim.crect.h; cy++) {
    		for(var cx = 0; cx < tim.crect.w; cx++) {
    			// STORE VALUE
    			this.data[(tim.crect.x + cx) + (tim.crect.y + cy) * VRAM.WIDTH] = reader.readUint16();
    		}
    	}
    	
    	var val;
    	for(var dy = 0; dy < tim.prect.h; dy++) {
    		for(var dx = 0; dx < tim.prect.w; dx++) {
    			// STORE VALUE
    			// try {
    				val = reader.readUint16();
    // 			} catch(e){
    // 				val = 0;
				// }
    			
    			this.data[(tim.prect.x + dx) + (tim.prect.y + dy) * VRAM.WIDTH] = val;//reader.readUint16();
    		}
    	}
		
		return tim;
	};
	
	VRAM.prototype.readData = function(rect, buffer) {
		var x, y;
		
		for(var i = 0, length = buffer.length; i < length; i++) {
			x = i % rect.w;
			y = (i - x) / rect.w;
			
			this.data[ this.addr( rect.x + x, rect.y + y ) ] = buffer[ i ];
		}
		
	};
	
	VRAM.prototype.toRgba = function(color) {
		var r = ((color&0x001f)<<3)|((color&0x001c)>>2),
			g = ((color&0x03e0)>>2)|((color&0x0380)>>7),
			b = ((color&0x7c00)>>7)|((color&0x7000)>>12),
			a = (((color&0x8000) >> 7)) ? 255 : (r != 0 || g != 0 || b != 0)? 128 : 0;
		
		return { r: r, g: g, b: b, a: a };
	};
	
	VRAM.prototype.getClut = function(x, y) {
	    return (((y)<<6)|(((x)>>4)&0x3f));
	};
	/*
	 * mode:
	 *  Texture mode
	 *  0: 4bitCLUT
	 *  1: 8bitCLUT
	 *  2: 16bitDirect
	 * 
	 * abr:
	 *  Semitransparency rate
	 *  0: 0.5 x Back + 0.5 x Forward
	 *  1: 1.0 x Back + 1.0 x Forward
	 *  2: 1.0 x Back - 1.0 x Forward
	 *  3: 1.0 x Back + 0.25 x Forward
	 */
	VRAM.prototype.getTPage = function(mode, abr, x, y) {
	    return ((((mode)&0x3)<<7)|(((abr)&0x3)<<5)|(((y)&0x100)>>4)|(((x)&0x3ff)>>6)|(((y)&0x200)<<2));
	};

	VRAM.prototype.dumpClut = function (clut) {
		console.log("clut(x, y): ", (clut&0x3f)<<4, (clut>>6));
	};
	
	VRAM.prototype.dumpTPage = function(tpage) {
		console.log("tpage(mode, abr, x, y): ", ((tpage)>>7)&0x003, ((tpage)>>5)&0x003, (((tpage)<<6)&0x7c0) % 1024, (((tpage)<<4)&0x100)+(((tpage)>>2)&0x200));
	};

	return VRAM;
})();