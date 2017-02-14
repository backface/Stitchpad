/*
    TurtleShepherd
    ------------------------------------------------------------------
    turltestich's embroidery intelligence agency
    Embroidery function for Javscript
    ------------------------------------------------------------------
    Copyright (C) 2016-2017 Michael Aschauer

*/

// TODO: Color Change integration

function TurtleShepherd() {
    this.init();
    this.pixels_per_millimeter = 5;
}

TurtleShepherd.prototype.init = function() {
    this.clear();
};

TurtleShepherd.prototype.clear = function() {
    this.cache = [];
    this.w = 0;
    this.h = 0;
    this.minX = 0;
    this.minY = 0;
    this.maxX = 0;
    this.maxY = 0;
    this.initX = 0;
    this.initY = 0;
    this.scale = 1;
    this.steps = 0;
    this.stitchCount = 0;
    this.jumpCount = 0;
};

TurtleShepherd.prototype.hasSteps = function() {
    return this.steps > 0;
};

TurtleShepherd.prototype.getStepCount = function() {
    return this.steps;
};
TurtleShepherd.prototype.getJumpCount = function() {
    return this.jumpCount;
};

TurtleShepherd.prototype.getDimensions = function() {
    w= ((this.maxX - this.minX)/5).toFixed(2).toString();
    h= ((this.maxY - this.minY)/5).toFixed(2).toString();
    return w + " x " + h + " mm";
};


TurtleShepherd.prototype.moveTo= function(x1, y1, x2, y2, penState) {
    if (this.steps === 0) {
        this.initX = x1;
        this.initY = y1;
        this.minX = x1;
        this.minY = y1;
        this.maxX = x1;
        this.maxY = y1;
        this.cache.push(
            {
                "cmd":"move",
                "x":x1,
                "y":y1,
                "penDown":penState,
            }
        );
    } else {
        if (x2 < this.minX) this.minX = x2;
        if (x2 > this.maxX) this.maxX = x2;

        if (y2 < this.minY) this.minY  = y2;
        if (y2 > this.maxY) this.maxY  = y2;
    }
    this.cache.push(
        {
            "cmd":"move",
            "x":x2,
            "y":y2,
            "penDown":penState,
        }
    );

    this.w = this.maxX - this.minX;
    this.h = this.maxY - this.minY;


    if (!penState)
        this.jumpCount++;
    else {
        this.steps++;
    }
};

TurtleShepherd.prototype.undoStep = function() {
	var last = this.cache.pop();
	if (last.cmd == "move") {
		if (last.penDown) {
			this.steps--;
		} else {
			this.jumpCount--;
		}
	}
};


TurtleShepherd.prototype.addColorChange= function(color) {
    this.cache.push(
        {
            "cmd":"color",
            "color":{
                r: Math.round(color.r),
                g: Math.round(color.g),
                b: Math.round(color.b),
                a: Math.round(color.a) || 0
            },
        }
    );
};

TurtleShepherd.prototype.normalize = function() {
	hasFirst = false;
	for (var i=0; i < this.cache.length; i++) {
		if (this.cache.cmd == "move") {
			if (!hasFirst) {
				this.minX = this.cache.x;
				this.minY = this.cache.y;
				this.maxX = this.cache.x;
				this.maxY = this.cache.y;
				hastFirst = true;
			} else {
				if (this.cache.x < this.minX) this.minX = this.cache.x;
				if (this.cache.x > this.maxX) this.maxX = this.cache.x;
				if (this.cache.y < this.minY) this.minY  = this.cache.y;
				if (this.cache.y > this.maxY) this.maxY  = this.cache.y;
			}
		}
	}
    for ( i=0; i < this.cache.length; i++) {
        this.cache.x = this.cache.x - this.minX;
        this.cache.y = this.cache.y - this.minY;
    }
};



TurtleShepherd.prototype.toSVG = function() {
    var svgStr = "<?xml version=\"1.0\" standalone=\"no\"?>\n";
    svgStr += "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \n\"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n";
    svgStr += '<svg width="' + (this.w) + '" height="' + (this.h) + '"' +
        ' viewBox="0 0 ' + (this.w) + ' ' + (this.h) + '"';
    svgStr += ' xmlns="http://www.w3.org/2000/svg" version="1.1">\n';
    svgStr += '<title>Embroidery export</title>\n';

    hasFirst = false;
    tagOpen = false;
    lastStitch = null;
    color = { r:0, g:0, b:0 };

    for (var i=0; i < this.cache.length; i++) {
        if (this.cache[i].cmd == "color") {
            /*if (tagOpen) svgStr += '" />\n';
            color = {
                    r: this.cache[i].color.r,
                    g: this.cache[i].color.g,
                    b: this.cache[i].color.b
                };
            tagOpen = false;*/
        } else if (this.cache[i].cmd == "move") {
            stitch = this.cache[i];
            if (!hasFirst) {
                if (stitch.penDown) {
                    svgStr += '<path fill="none" style="stroke:rgb('+
                        color.r + ',' + color.g + ',' + color.b +
                        ')" d="M ' +
                        (this.initX - this.minX) +
                        ' ' +
                        (this.maxY - this.initY) ;
                    hasFirst = true;
                    tagOpen = true;
                } else {
                    /* is jum
                    svgStr += '<path stroke="red" stroke-dasharray="4 4" d="M ' +
                        this.initX +
                        ' ' +
                        this.initY +
                        ' L ' +
                        (stitch.x) +
                        ' ' +
                        (stitch.y) +
                        '" />\n' ;
                    */
                    //hasFirst = true;
                }

            } else {
                if (stitch.penDown ) {
                    if (!lastStich.penDown ) {
                        svgStr +='  <path fill="none" style="stroke:rgb('+
                            color.r + ',' + color.g + ',' + color.b +
                            ')" d="M ' +
                            (lastStich.x - this.minX) +
                            ' ' +
                            (this.maxY - lastStich.y) +
                            ' L ' +
                            (stitch.x - this.minX) +
                            ' ' +
                            (this.maxY -  stitch.y);
                    }
                    svgStr += ' L ' +
                        (stitch.x- this.minX) +
                        ' ' +
                        (this.maxY - stitch.y);
                    tagOpen = true;
                } else {
                    if (tagOpen) svgStr += '" />\n';
                    tagOpen = false;
                    /* is jump
                    svgStr += '<path stroke="red" stroke-dasharray="4 4" d="M ' +
                        (this.cache[i-1].x) +
                        ' ' +
                        (this.cache[i-1].y) +
                        ' L ' +
                        (stitch.x) +
                        ' ' +
                        (stitch.y) +
                    '" />\n' ;
                    */
                }
            }
            lastStich = stitch;
        }
    }
    if (tagOpen) svgStr += '" />\n';
    svgStr += '</svg>\n';

    return svgStr;
};

TurtleShepherd.prototype.toEXP = function() {
    var expArr = [];
    this.pixels_per_millimeter = 5;
    scale = 10 / this.pixels_per_millimeter;
    lastStitch = null;
    hasFirst = false;

    function move(x, y) {
        y *= -1;
        if (x<0) x = x + 256;
        expArr.push(Math.round(x));
        if (y<0) y = y + 256;
        expArr.push(Math.round(y));
    }

    for (var i=0; i < this.cache.length; i++) {
        if (this.cache[i].cmd == "color") {
            //expArr.push(0x01);
            //expArr.push(0x01);
        } else if (this.cache[i].cmd == "move") {
            stitch = this.cache[i];

            if (hasFirst) {
                x1 = Math.round(stitch.x * scale);
                y1 = -Math.round(stitch.y * scale);
                x0 = Math.round(lastStitch.x * scale);
                y0 = -Math.round(lastStitch.y * scale);

                sum_x = 0;
                sum_y = 0;
                dmax = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
                dsteps = Math.abs(dmax / 127) + 1;
                if (dsteps == 1) {
                    if (!stitch.penDown) {
                        //ignore color
                        //expArr.push(0x80);
                        //expArr.push(0x04);
                    }
                    move(Math.round(x1 - x0), Math.round(y1 - y0));
                } else {
                    for(j=0;j<dsteps;j++) {
                        if (!stitch.penDown) {
                            expArr.push(0x80);
                            expArr.push(0x04);
                        }
                        if (j < dsteps -1) {
                            move((x1 - x0)/dsteps, (y1 - y0)/dsteps);
                            sum_x += (x1 - x0)/dsteps;
                            sum_y += (y1 - y0)/dsteps;
                        } else {
                            move(Math.round((x1 - x0) - sum_x),
                                Math.round((y1 - y0) - sum_y));
                        }
                    }
                }

            }
            lastStitch = stitch;
            hasFirst = true;
        }
    }

    expUintArr = new Uint8Array(expArr.length);
    for (i=0;i<expArr.length;i++) {
        expUintArr[i] = Math.round(expArr[i]);
    }
    return expUintArr;
};


TurtleShepherd.prototype.toDST = function() {
    var expArr = [];
    lastStitch = null;
    hasFirst = false;
    this.pixels_per_millimeter = 5;
    scale = 10 / this.pixels_per_millimeter;

    function encodeTajimaStitch(dx, dy, jump) {
        b1 = 0;
        b2 = 0;
        b3 = 0;

        if (dx > 40) {
                b3 |= 0x04;
                dx -= 81;
        }

        if (dx < -40) {
                b3 |= 0x08;
                dx += 81;
        }

        if (dy > 40) {
                b3 |= 0x20;
                dy -= 81;
        }

        if (dy < -40) {
                b3 |= 0x10;
                dy += 81;
        }

        if (dx > 13) {
                b2 |= 0x04;
                dx -= 27;
        }

        if (dx < -13) {
                b2 |= 0x08;
                dx += 27;
        }

        if (dy > 13) {
                b2 |= 0x20;
                dy -= 27;
        }

        if (dy < -13) {
                b2 |= 0x10;
                dy += 27;
        }

        if (dx > 4) {
                b1 |= 0x04;
                dx -= 9;
        }

        if (dx < -4) {
                b1 |= 0x08;
                dx += 9;
        }

        if (dy > 4) {
                b1 |= 0x20;
                dy -= 9;
        }

        if (dy < -4) {
                b1 |= 0x10;
                dy += 9;
        }

        if (dx > 1) {
                b2 |= 0x01;
                dx -= 3;
        }

        if (dx < -1) {
                b2 |= 0x02;
                dx += 3;
        }

        if (dy > 1) {
                b2 |= 0x80;
                dy -= 3;
        }

        if (dy < -1) {
                b2 |= 0x40;
                dy += 3;
        }

        if (dx > 0) {
                b1 |= 0x01;
                dx -= 1;
        }

        if (dx < 0) {
                b1 |= 0x02;
                dx += 1;
        }

        if (dy > 0) {
                b1 |= 0x80;
                dy -= 1;
        }

        if (dy < 0) {
                b1 |= 0x40;
                dy += 1;
        }

        expArr.push(b1);
        expArr.push(b2);
        if (jump) {
            expArr.push(b3 | 0x83);
        } else {
            expArr.push(b3 | 0x03);
        }
    }

    // Print empty header
    for (var i=0; i<512; i++) {
        expArr.push(0x00);
    }

    for (i=0; i < this.cache.length; i++) {
        if (this.cache[i].cmd == "color") {
            //expArr.push(0x01);
            //expArr.push(0x01);
        } else if (this.cache[i].cmd == "move") {
            stitch = this.cache[i];

            if (hasFirst) {
                x1 = Math.round(stitch.x * scale);
                y1 = Math.round(stitch.y * scale);
                x0 = Math.round(lastStitch.x * scale);
                y0 = Math.round(lastStitch.y * scale);

                sum_x = 0;
                sum_y = 0;
                dmax = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
                dsteps = Math.abs(dmax / 127) + 1;
                if (dsteps == 1) {
                    encodeTajimaStitch((x1 - x0), (y1 - y0),
                        !stitch.penDown);
                } else {
                    for(j=0;j<dsteps;j++) {
                        //if (tStitch.stitches.jump[i])  {
                        //	expArr.push(0x80);
                        //	expArr.push(0x04);
                        //}
                        if (j < dsteps -1) {
                            encodeTajimaStitch(
                                Math.round((x1 - x0)/dsteps),
                                Math.round((y1 - y0)/dsteps),
                                !stitch.penDown
                            );
                            sum_x += (x1 - x0)/dsteps;
                            sum_y += (y1 - y0)/dsteps;
                        } else {
                            encodeTajimaStitch(
                                Math.round((x1 - x0) - sum_x),
                                Math.round((y1 - y0) - sum_y),
                                !stitch.penDown
                            );
                        }
                    }
                }
            }
            lastStitch = stitch;
            hasFirst = true;
        }
    }

    expArr.push(0x00);
    expArr.push(0x00);
    expArr.push(0xF3);

    expUintArr = new Uint8Array(expArr.length);
    for (i=0;i<expArr.length;i++) {
        expUintArr[i] = Math.round(expArr[i]);
    }
    return expUintArr;
};

TurtleShepherd.prototype.debug_msg = function (st, clear) {
	o = "";
	if (!clear) {
		o = document.getElementById("debug").innerHTML;
	} else {
		o = "";
	}
	o = st + "<br />" + o;
	document.getElementById("debug").innerHTML = o;
};
