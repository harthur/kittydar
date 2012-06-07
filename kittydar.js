var brain = require("brain"),
    hog = require("hog-descriptor");

var network = require("./network");
var net = new brain.NeuralNetwork().fromJSON(network);

if (process.arch) {
  // in node
  var Canvas = (require)('canvas');
}

function createCanvas (width, height) {
  if (typeof Canvas !== 'undefined') {
    return new Canvas(width, height);
  }
  else {
    var canvas = document.createElement('canvas');
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    return canvas;
  }
}

var kittydar = {
  minWindow: 48,

  threshold: 0.999,

  detectCats: function(canvas, options) {
    this.setOptions(options || {});

    var resizes = this.getAllSizes(canvas, this.minWindow);

    var cats = [];
    resizes.forEach(function(resize) {
      var kitties = kittydar.detectAtFixed(resize.imagedata, resize.scale);
      cats = cats.concat(kitties);
    });
    cats = this.combineOverlaps(cats);

    return cats;
  },

  setOptions: function(options) {
    this.minWindow = options.minWindow || 48;
    this.threshold = options.threshold || 0.90;
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
        scale: winScale,
        size: size
      })
    }
    return resizes;
  },

  resizeToFixed: function(canvas, scale) {
    var width = Math.floor(canvas.width * scale);
    var height = Math.floor(canvas.height * scale);

    // resize the image so the fixed size can mimic window size
    canvas = resizeCanvas(canvas, width, height);
    var ctx = canvas.getContext("2d");
    var imagedata = ctx.getImageData(0, 0, width, height);

    return imagedata;
  },

  isCat: function(intensities) {
    var fts = hog.extractHOGFromIntensities(intensities, this.HOGparams);
    var prob = net.run(fts)[0];
    return prob;
  },

  detectAtFixed: function(imagedata, scale, fixed) {
    // Detect using a sliding window of a fixed size.
    // Take an ImageData instead of canvas so that this can be
    // used from a Worker thread.
    fixed = fixed || this.minWindow;
    var intensities = hog.intensities(imagedata);
    var shift = 6;
    var cats = [];

    for (var y = 0; y + fixed < imagedata.height; y += shift) {
      for (var x = 0; x + fixed < imagedata.width; x += shift) {
        var win = getRect(intensities, x, y, fixed, fixed);
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

  combineOverlaps: function(rects, overlap, min) {
    // non-maximum suppression - remove overlapping rects
    overlap = overlap || 0.5;
    min = min || 0;

    for (var i = 0; i < rects.length; i++) {
      var r1 = rects[i];
      r1.tally = 0; // number of rects it's suppressed

      for (var j = 0; j < i; j++) {
            r2 = rects[j];

        if (doesOverlap(r1, r2)) {
          if (r1.prob > r2.prob) {
            r2.suppressed = true;
            r1.tally += 1 + r2.tally;
          }
          else {
            r1.suppressed = true;
            r2.tally += 1 + r1.tally;
          }
        }
      }
    }
    // only take a rect if it wasn't suppressed by any other rect
    return rects.filter(function(rect) {
      return !rect.suppressed && rect.tally >= min;
    })
  }
}

function getRect(matrix, x, y, width, height) {
  var square = new Array(height);
  for (var i = 0; i < height; i++) {
    square[i] = new Array(width);
    for (var j = 0; j < width; j++) {
      square[i][j] = matrix[y + i][x + j];
    }
  }
  return square;
}

function resizeCanvas(canvas, width, height) {
  var resizeCanvas = createCanvas(width, height);
  var ctx = resizeCanvas.getContext('2d');
  ctx.patternQuality = "best";

  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height,
                0, 0, width, height);
  return resizeCanvas;
}

function doesOverlap(r1, r2, overlap) {
  var overlapW, overlapH;
  if (r1.x > r2.x) {
    overlapW = Math.min((r2.x + r2.width) - r1.x, r1.width);
  }
  else {
    overlapW = Math.min((r1.x + r1.width) - r2.x, r2.width);
  }

  if (r1.y > r2.y) {
    overlapH = Math.min((r2.y + r2.height) - r1.y, r1.height);
  }
  else {
    overlapH = Math.min((r1.y + r1.height) - r2.y, r2.height);
  }

  if (overlapW <= 0 || overlapH <= 0) {
    return false;
  }
  var intersect = overlapW * overlapH;
  var union = (r1.width * r1.height) + (r2.width * r2.height) - (intersect * 2);

  if (intersect / union > 0.5) {
    return true;
  }
  return false;
}


module.exports = kittydar;
