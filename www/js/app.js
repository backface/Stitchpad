$(function() {
	createGrid();

	var type = /(canvas|webgl)/.test(url.type) ? url.type : 'svg';
	var elem = document.getElementById('stage');
	var two = new Two({
		type: Two.Types[type],
		fullscreen: true,
		autostart: true
	}).appendTo(elem);
	var turtleShepherd = new TurtleShepherd();

	var stitches = two.makeGroup();
	var lines = two.makeGroup();
	var isJump = false;
	var dragged = false;
	var interpolate = false;
	var dist_min = 8;
	var dist_max = 10;

	// TODO: PAN/Zoom
	// TODO: plus pinch-to-zoom for mobile.

	/*

	var dy = 1;
	var scene_transform = {
		ticking: false,
		initX: 0,
		initY: 0,
		initScale: 1,
		x: 0,
		y: 0,
		scale: 1,
		center: {
			x: two.width / 2,
			y: two.height / 2
		},
		origin: {},
	};

	var zui = new ZUI(two);
	zui.addLimits(0.06, 8);*

	$(window).bind('mousewheel wheel', function(event) {
		var e = event.originalEvent;
		e.stopPropagation();
		e.preventDefault();
		dy = (e.wheelDeltaY || - e.deltaY) / 100;
		//zui.zoomBy(dy, e.clientX, e.clientY);

		zui.zoomBy(dy, (two.width / 2), (two.height / 2));

		scene_transform.scale = zui.scale;
		scene_transform.center.x = e.clientX;
		scene_transform.center.y = e.clientY;

		// Update canvas zoom. This will alter the X/Y coordinates by a bit.
		var matrix = zui.zoomSet(scene_transform.scale, (two.width / 2), (two.height / 2));

		// Pull the new X/Y coordinates out of ZUI and keep our stuff in sync.
		var offset = zui.updateOffset();
		scene_transform.x = offset.surfaceMatrix.elements[2];
		scene_transform.y = offset.surfaceMatrix.elements[5];

		var REL_SCALE = 1 / scene_transform.scale;
		var REL_X = Math.floor((-scene_transform.x + (two.width / 2)) / scene_transform.scale);
		var REL_Y = Math.floor((-scene_transform.y + (two.height / 2)) / scene_transform.scale);

	});
	*/
	var x, y, line, mouse = new Two.Vector(), randomness = 2;
	var lastPos = null;


	var addPoint = function(pos) {
		var point = two.makeCircle(pos.x, pos.y, 1.5);
		point.fill = '#000';
		stitches.add(point);
	};

	var addLine = function(pos1, pos2) {
		var line;
		var dist = Math.sqrt(
			Math.pow((pos1.x - pos2.x), 2) +
			Math.pow((pos1.y - pos2 .y ), 2)
		);

		if (isJump) {
			line = two.makeLine(pos1.x, pos1.y, pos2.x, pos2.y);
			line.noFill().stroke = '#f00';
			line.linewidth = 1;
			line.opacity = 0.5;
			lines.add(line);
			turtleShepherd.moveTo(pos1.x, -pos1.y, pos2.x, -pos2.y, false);
			toogleJump();
		} else {
				line = two.makeLine(pos1.x, pos1.y, pos2.x, pos2.y);
				line.noFill().stroke = '#333';
				line.linewidth = 2;
				lines.add(line);
				turtleShepherd.moveTo(pos1.x, -pos1.y, pos2.x, -pos2.y, true);
		}
	};

	var drag = function(e) {
			dragged = true;
			var pos =  new Two.Vector(e.clientX, e.clientY);
			if (lastPos) {
				var dist = Math.sqrt( Math.pow((lastPos.x - pos.x), 2) + Math.pow((lastPos.y - pos.y ), 2) );
				if  (dist > dist_max && interpolate) {
					p = lineInterpolate( lastPos, pos, dist_min );
					for (var i = 0; i < p.length-1; i++) {
						addPoint(p[i+1]);
						addLine(p[i],p[i+1]);
						lastPos = p[i+1];
					}
				} else if (dist > dist_min) {
					addPoint(pos);
					addLine(lastPos, pos);
					lastPos = pos;
				}
			} else {
				addPoint(pos);
				lastPos = pos;
			}
	};

	var dragEnd = function(e) {
		var pos =  new Two.Vector(e.clientX, e.clientY);
		if (!dragged) {
			if (lastPos) {
				var dist = Math.sqrt( Math.pow((lastPos.x - pos.x), 2) + Math.pow((lastPos.y - pos.y ), 2) );
				if  (dist > dist_max && interpolate) {
					p = lineInterpolate( lastPos, pos, dist_min );
					for (var i = 0; i < p.length-1; i++) {
						addPoint(p[i+1]);
						addLine(p[i],p[i+1]);
						lastPos = p[i+1];
					}
				} else {
					addLine(lastPos, pos);
					addPoint(pos);
					lastPos = pos;
				}
			} else {
				addPoint(pos);
				lastPos = pos;
			}
		}
		dragged = false;
		$(this)
		  .unbind('mousemove', drag)
		  .unbind('mouseup', dragEnd);
	};

	var touchDrag = function(e) {
		e.preventDefault();
		var touch = e.originalEvent.changedTouches[0];
		drag({
		  clientX: touch.pageX,
		  clientY: touch.pageY
		});
		return false;
	};

	var touchEnd = function(e) {
		e.preventDefault();
		var touch = e.originalEvent.changedTouches[0];
		dragEnd({
		  clientX: touch.pageX,
		  clientY: touch.pageY
		});
		$(this)
		  .unbind('touchmove', touchDrag)
		  .unbind('touchend', touchEnd);
		return false;
	};

	stage = $(two.renderer.domElement).parent();
	stage
	 .bind('mousedown', function(e) {
		$(this)
		.bind('mousemove', drag)
		.bind('mouseup', dragEnd);
	})
	 .bind('touchstart', function(e) {
		e.preventDefault();
		var touch = e.originalEvent.changedTouches[0];
		$(this)
			.bind('touchmove', touchDrag)
			.bind('touchend', touchEnd);
		return false;
	});

	var clear = function() {
		turtleShepherd.clear();
		two.clear();
		lines =  two.makeGroup();
		stitches = two.makeGroup();
		lastPos = null;
	};

	var undo = function() {
		turtleShepherd.undoStep();
		lines.remove(_.last(lines.children));
		stitches.remove(_.last(stitches.children));
	};

	// TODO: Save
	var save = function (format, name) {
		name = name || "noname";
		turtleShepherd.normalize();
		switch (format) {
			case "exp":
				expUintArr = turtleShepherd.toEXP();
    			blob = new Blob([expUintArr], {type: 'application/octet-stream'});
    			saveAs(blob, name + '.exp');
				break;
		    case "dst":
				expUintArr = turtleShepherd.toDST();
				blob = new Blob([expUintArr], {type: 'application/octet-stream'});
				saveAs(blob, name + '.dst');
				break;
			case "svg":
				svgStr = turtleShepherd.toSVG();
			    blob = new Blob([svgStr], {type: 'text/plain;charset=utf-8'});
				saveAs(blob, name + '.svg');
				break;
			default:
				return;
		}
	};


	$('#ts-do-save-form').submit( function(e) {
		//save("submit me");
		name = $(this).find('#projectname').val() || "unnamed";
		format =  $(this).find('input[name=format]').filter(':checked').val();
		save(format,name);
		save_dialog.close();
		return false;
	});


	$(window).bind('keydown', function(event) {
		if (event.key == 'j') {
			toogleJump();
		}
		if (event.key == 'i') {
			toogleInterpolate();
		}
		if (event.key == 'g') {
			toggleGrid();
		}
		if (event.key == 'b') {
			load_image_dialog.showModal();
		}
		if (event.key == 'z' && event.ctrlKey) {
			undo();
		}
	});

	var toogleJump = function() {
		isJump = !isJump;
		if (isJump) {
			$(".ts-jump").addClass("mdl-button--accent");
		} else {
			$(".ts-jump").removeClass("mdl-button--accent");
		}
	};

	var toogleInterpolate = function() {
		interpolate = !interpolate;
		if (interpolate) {
			$(".ts-interpolate").addClass("mdl-button--accent");
		} else {
			$(".ts-interpolate").removeClass("mdl-button--accent");
		}
	};

	var toogleGrid = function() {
		$("#grid").toggle();
		if ($(".grid").is(":visible"))
			$(".ts-grid i").html("grid_off");
		else
			$(".ts-grid i").html("grid_on");
	};


	$(".ts-clear").click ( function(e) {
		e.preventDefault();
		clear();
	});

	$(".ts-jump").click ( function(e) {
		toogleJump();
	});

	$(".ts-interpolate").click ( function(e) {
		toogleInterpolate();
	});

	$(".ts-undo").click ( function(e) {
		undo();
	});

	$(".ts-grid").click ( function(e) {
		toogleGrid();
	});

	function createGrid(s) {
		var size = s || 50;
		var two = new Two({
		  type: Two.Types.canvas, width: size, height: size
		});

		var a = two.makeLine(two.width / 2, 0, two.width / 2, two.height);
		var b = two.makeLine(0, two.height / 2, two.width, two.height / 2);
		a.stroke = b.stroke = '#6dcff6';

		two.update();

		_.defer(function() {
			$("#grid").css({
				background: 'url(' + two.renderer.domElement.toDataURL('image/png') + ') 0 0 repeat',
				backgroundSize: size + 'px ' + size + 'px'
			});
		});
	}

});
