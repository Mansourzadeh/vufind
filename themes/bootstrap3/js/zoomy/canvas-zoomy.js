var Zoomy = {
  mouseDown: false,
  // Create
  init: function(canvas) {
    this.canvas  = canvas;
    this.canvas.width  = Math.floor(this.canvas.clientWidth);
    this.canvas.height = Math.floor(this.canvas.clientHeight);
    addEventListener('resize', function() {
      Zoomy.canvas.width  = Math.floor(Zoomy.canvas.clientWidth);
      Zoomy.canvas.height = Math.floor(Zoomy.canvas.clientHeight);
      Zoomy.width = Zoomy.canvas.width;
      Zoomy.height = Zoomy.canvas.height;
      Zoomy.minimap = null;
      Zoomy.rebound();
      Zoomy.draw();
    }, false);
    addEventListener('mousemove', Zoomy.mouseHandle, false);
    addEventListener('touchmove', Zoomy.mouseHandle, false);
    addEventListener('mouseup', function(e) {
      Zoomy.mouseDown = false;
      Zoomy.mouse = undefined;
    }, false);
    addEventListener('touchend', function(e) {
      Zoomy.mouseDown = false;
      Zoomy.mouse = undefined;
    }, false);
    this.canvas.addEventListener('mousedown', function(e) {
      Zoomy.mouseDown = true;
    }, false);
    this.canvas.addEventListener('touchstart', function(e) {
      Zoomy.mouseDown = true;
    }, false);
    this.canvas.addEventListener('mousewheel', function(e) {
      e.preventDefault();
      Zoomy.zoom(e);
    }, false);
    this.canvas.addEventListener('wheel', function(e) {
      e.preventDefault();
      Zoomy.zoom(e);
    }, false);
    this.context = canvas.getContext('2d');

    Math.TWO_PI = Math.PI*2;
    Math.HALF_PI = Math.PI/2;
  },
  initMinimap: function() {
    var aspectRatio = this.image.width / this.image.height;
    var size = 150;
    var mm = {
      width  : this.image.width > this.image.height ? size : size * aspectRatio,
      height : this.image.height > this.image.width ? size : size / aspectRatio,
      size   : size
    };
    if(this.image.sideways) {
      var t = mm.width;
      mm.width = mm.height;
      mm.height = t;
    }
    mm.x = this.width  - (size+mm.width)/2 - 10;
    mm.y = this.height - (size+mm.height)/2 - 10;
    return mm;
  },
  mouseHandle: function(e) {
    if(!Zoomy.mouseDown) return;
    e.preventDefault();
    var mx = e.type.match("touch")
      ? e.targetTouches[0].pageX
      : e.pageX;
    mx -= Zoomy.canvas.offsetLeft;
    var my = e.type.match("touch")
      ? e.targetTouches[0].pageY
      : e.pageY;
    my -= Zoomy.canvas.offsetTop;
    if(typeof Zoomy.mouse !== "undefined") {
      Zoomy.image.x = Math.floor(Zoomy.image.x + mx - Zoomy.mouse.x);
      Zoomy.image.y = Math.floor(Zoomy.image.y + my - Zoomy.mouse.y);
      Zoomy.enforceBounds();
      Zoomy.draw();
    }
    Zoomy.mouse = {x: mx, y: my};
  },
  // Load image
  load: function(src, callback) {
    if(typeof this.canvas === "undefined") return;
    var img = new Image();
    img.onloadstart = function () { console.log('Loading...'); };
    img.onprogress = function (e) { console.log(e.loaded / e.total * 100); };
    img.onload = function() { Zoomy.finishLoad(img); if(typeof callback !== "undefined") callback(); }
    img.onerror = function () { /* Load failed. Show a custom error message. */ }
    img.onloadend = function () { /* Load either either succeeded or failed. Either way, hide the progress bar. */ };
    img.src = src;
  },
  finishLoad: function(img) {
    //console.log('Loaded.');
    Zoomy.image = {
      x: 0,
      y: 0,
      angle: 0,
      sideways: false,
      content: img,
      transX: 0,
      transY: 0,
    }
    Zoomy.minimap = null;
    Zoomy.center();
  },
  draw: function() {
    this.context.clearRect(0,0,this.width,this.height);
    // Image
    this.context.save();
    this.context.translate(this.image.x, this.image.y);
    this.context.rotate(this.image.angle);
    this.context.translate(this.image.transX, this.image.transY);
    this.context.drawImage(
      this.image.content, 0, 0,
      this.image.rwidth,
      this.image.rheight
    );
    this.context.restore();
    // Minimap
    if(this.minimap == null) {
      this.minimap = this.initMinimap();
    }
    this.context.save();
    this.context.translate(this.minimap.x, this.minimap.y);
    this.context.drawImage(
      this.image.content,
      0, 0,
      this.minimap.width,
      this.minimap.height
    );
    this.context.strokeStyle = "#00F";

    var hLength = (this.width  / this.image.rwidth)  * this.minimap.width;
    var vLength = (this.height / this.image.rheight) * this.minimap.height;
    var drawWidth  = this.image.sideways ? vLength : hLength;
    var drawHeight = this.image.sideways ? hLength : vLength;

    var xdiff = this.image.sideways
      ? -(this.image.y / this.image.height) * this.minimap.width
      : -(this.image.x / this.image.width)  * this.minimap.width;
    var ydiff = this.image.sideways
      ? -(this.image.x / this.image.width)  * this.minimap.height
      : -(this.image.y / this.image.height) * this.minimap.height;
    switch(this.image.angle % Math.TWO_PI) {
      case 0:
        break;
      case Math.HALF_PI: // On right side
        ydiff = this.minimap.height - drawHeight - ydiff;
        break;
      case Math.PI: // Upside-down
        xdiff = this.minimap.width  - drawWidth  - xdiff;
        ydiff = this.minimap.height - drawHeight - ydiff;
        break;
      default: // On left side
        xdiff = this.minimap.width  - drawWidth  - xdiff;
        break;
    }

    if(drawWidth > this.minimap.width) {
      xdiff = 0;
      drawWidth = this.minimap.width;
    }
    if(drawHeight > this.minimap.height) {
      ydiff = 0;
      drawHeight = this.minimap.height;
    }
    this.context.strokeRect(
      Math.max(0, xdiff),
      Math.max(0, ydiff),
      drawWidth,
      drawHeight
    );
    this.context.restore();
  },
  center: function() {
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.image.zoom = this.image.minZoom = Math.min(
      (this.width-10)/this.image.content.width, 1,
      (this.height-10)/this.image.content.height
    );
    this.zoom(0, this.image.zoom);
    this.image.x = Math.floor((this.width-this.image.width)/2);
    this.image.y = Math.floor((this.height-this.image.height)/2);
    this.rebound();
    this.draw();
  },
  turnLeft: function() {
    var newx = this.width/2  + (this.image.y - this.height/2);
    var newy = this.height/2 + (this.width/2 - this.image.x - this.image.width);
    this.image.x = newx;
    this.image.y = newy;

    this.image.angle = (this.image.angle + Math.PI + Math.HALF_PI) % Math.TWO_PI;
    this.image.width = [this.image.height, this.image.height=this.image.width][0];
    this.image.sideways = !this.image.sideways;

    this.rebound();
    this.draw();
  },
  turnRight: function() {
    var newx = this.width/2  + (this.height/2 - this.image.y - this.image.height);
    var newy = this.height/2 + (this.image.x - this.width/2);
    this.image.x = newx;
    this.image.y = newy;

    this.image.angle = (this.image.angle + Math.HALF_PI) % Math.TWO_PI;
    this.image.width = [this.image.height, this.image.height=this.image.width][0];
    this.image.sideways = !this.image.sideways;

    this.rebound();
    this.draw();
  },
  rebound: function() {
    var xDiff = this.width-this.image.width;
    var yDiff = this.height-this.image.height;
    this.image.minX = Math.min(0, xDiff);
    this.image.minY = Math.min(0, yDiff);
    this.image.maxX = Math.max(xDiff, 0);
    this.image.maxY = Math.max(yDiff, 0);
    this.enforceBounds();
    var rotation = this.image.angle / Math.HALF_PI;
    this.image.transX = rotation == 2
      ? -this.image.width
      : rotation == 3
        ? -this.image.height
        : 0;
    this.image.transY = rotation == 1
      ? -this.image.width
      : rotation == 2
        ? -this.image.height
        : 0;
  },
  enforceBounds: function() {
    if(this.image.x < this.image.minX) this.image.x = this.image.minX;
    if(this.image.y < this.image.minY) this.image.y = this.image.minY;
    if(this.image.x > this.image.maxX) this.image.x = this.image.maxX;
    if(this.image.y > this.image.maxY) this.image.y = this.image.maxY;
  },
  zoom: function(event, zoom) {
    if (typeof zoom === "undefined") {
      var delta = typeof event.deltaY === "undefined"
        ? event.detail/Math.abs(event.detail)
        : event.deltaY/Math.abs(event.deltaY);
      this.image.zoom *= 1-(delta/12);
    } else {
      this.image.zoom = zoom;
    }
    if (this.image.zoom < this.image.minZoom) {
      this.image.zoom = this.image.minZoom;
    }

    var mousex = this.width/2;
    var mousey = this.height/2;
    if (typeof event.offsetX !== "undefined") {
      mousex = event.offsetX;
      mousey = event.offsetY;
    } else if (typeof event.layerX !== "undefined") {
      mousex = event.layerX;
      mousey = event.layerY;
    }

    var newWidth  = Math.floor(this.image.content.width * this.image.zoom);
    var newHeight = Math.floor(this.image.content.height * this.image.zoom);

    if ((this.image.angle/Math.HALF_PI) % 2 > 0) {
      newWidth = [newHeight, newHeight = newWidth][0];
      this.image.rwidth = newHeight;
      this.image.rheight = newWidth;
    } else {
      this.image.rwidth = newWidth;
      this.image.rheight = newHeight;
    }

    this.image.x -= Math.floor(((mousex-this.image.x)/this.image.width)*(newWidth-this.image.width));
    this.image.y -= Math.floor(((mousey-this.image.y)/this.image.height)*(newHeight-this.image.height));

    this.image.width = newWidth;
    this.image.height = newHeight;
    this.rebound();
    this.draw();
  }
};