var kittydar = {
  detectCats: function(canvas, options) {
    this.setOptions(options || {});

    var resizes = this.getAllSizes(canvas, min);

    var cats = [];
    resizes.forEach(function(resize) {
      var kitties = kittydar.detectAtFixed(resize.imagedata, resize.scale);
      cats = cats.concat(kitties);
    });
    return cats;
  },

  setOptions: function(options) {
    this.minWindow = options.minWindow || 48;
    this.threshold = options.threshold || 0.98;
    this.network = options.network || network;
    this.HOGparams = options.HOGparams || {
      "cellSize": 4,
      "blockSize": 2,
      "blockStride": 1,
      "bins": 6,
      "norm": "L2"
    };
  },

  getAllSizes: function(canvas, fixed) {
    // for use with Worker threads, return canvas ImageDatas
    // resized to accomodate various window sizes

    // smallest window size
    fixed = fixed || this.minWindow;

    // resize canvas to cut down on number of windows to check
    var resize = 360;
    var max = Math.max(canvas.width, canvas.height)
    var scale = Math.min(max, resize) / max;

    var resizes = [];
    for (var size = fixed; size < max; size += 12) {
      var winScale = (fixed / size) * scale;
      var imagedata = this.resizeToFixed(canvas, winScale);

      resizes.push({
        imagedata: imagedata,
        scale: winScale
      })
    }
    return resizes;
  },

  resizeToFixed: function(canvas, scale) {
    var width = Math.floor(canvas.width * scale);
    var height = Math.floor(canvas.height * scale);

    // resize the image so the fixed size can mimic window size
    canvas = this.resizeCanvas(canvas, width, height);
    var ctx = canvas.getContext("2d");
    var imagedata = ctx.getImageData(0, 0, width, height);

    return imagedata;
  },

  isCat: function(intensities) {
    var fts = hog.extractHOGFromIntensities(intensities, this.HOGparams);
    var prob = this.network.run(fts)[0];
    return prob;
  },

  detectAtFixed: function(imagedata, scale, fixed) {
    // Only detect using a sliding window of a fixed size.
    // Take an ImageData instead of canvas so that this can be
    // used from a Worker thread.
    fixed = fixed || this.minWindow;
    var intensities = hog.intensities(imagedata);
    var shift = 6;
    var cats = [];

    for (var y = 0; y + fixed < imagedata.height; y += shift) {
      for (var x = 0; x + fixed < imagedata.width; x += shift) {
        var win = this.getRect(intensities, x, y, fixed, fixed);
        var prob = this.isCat(win, network);

        if (prob > this.threshold) {
          cats.push({
            x: Math.floor(x / scale),
            y: Math.floor(y / scale),
            width: Math.floor(fixed / scale),
            height: Math.floor(fixed / scale),
            prob: prob
          });
        }
      }
    }
    return cats;
  },

  getRect: function(matrix, x, y, width, height) {
    var square = new Array(height);
    for (var i = 0; i < height; i++) {
      square[i] = new Array(width);
      for (var j = 0; j < width; j++) {
        square[i][j] = matrix[y + i][x + j];
      }
    }
    return square;
  },

  resizeCanvas: function(canvas, width, height) {
    var resizeCanvas = document.createElement("canvas");
    resizeCanvas.width = width;
    resizeCanvas.height = height;

    var ctx = resizeCanvas.getContext('2d');
    ctx.patternQuality = "best";

    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height,
                  0, 0, width, height);
    return resizeCanvas;
  }
}