var brain = require("brain"),
    hog = require("hog-descriptor");

var network = require("./network.js");

var net = new brain.NeuralNetwork().fromJSON(network);

if (process.arch) {
  // in node
  var Canvas = (require)('canvas');
}

function createCanvas (width, height) {
  if (typeof Canvas !== 'undefined') {
    // have node-canvas
    return new Canvas(width, height);
  }
  else {
    // in browser
    var canvas = document.createElement('canvas');
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    return canvas;
  }
}

var kittydar = {
  patchSize: 48,       // size of training images in px

  minSize: 48,         // starting window size

  resize: 360,         // initial image resize size in px

  threshold: 0.999,    // probablity threshold for classifying

  scaleStep: 6,        // scaling step size in px

  shiftBy: 6,         // px to slide window by

  overlapThresh: 0.4,  // min overlap ratio to classify as an overlap

  minOverlaps: 1,      // minumum overlapping rects to classify as a head

  detectCats: function(canvas, options) {
    this.setOptions(options || {});

    var resizes = this.getAllSizes(canvas, this.minSize);

    var cats = [];
    resizes.forEach(function(resize) {
      var kitties = kittydar.detectAtScale(resize.imagedata, resize.scale);
      cats = cats.concat(kitties);
    });
    cats = this.combineOverlaps(cats);

    return cats;
  },

  setOptions: function(options) {
    for (var opt in options) {
      this[opt] = options[opt];
    }
    this.HOGparams = options.HOGparams || {
      "cellSize": 6,
      "blockSize": 2,
      "blockStride": 1,
      "bins": 6,
      "norm": "L2"
    };
  },

  getAllSizes: function(canvas, minSize) {
    // For use with Worker threads, return canvas ImageDatas
    // resized to accomodate various window sizes

    minSize = minSize || this.minSize;

    // resize canvas to cut down on number of windows to check
    var resize = this.resize;
    var max = Math.max(canvas.width, canvas.height)
    var scale = Math.min(max, resize) / max;

    var resizes = [];
    for (var size = minSize; size < max; size += this.scaleStep) {
      var winScale = (minSize / size) * scale;
      var imagedata = this.scaleCanvas(canvas, winScale);

      resizes.push({
        imagedata: imagedata,
        scale: winScale,
        size: size
      })
    }
    return resizes;
  },

  scaleCanvas: function(canvas, scale) {
    var width = Math.floor(canvas.width * scale);
    var height = Math.floor(canvas.height * scale);

    canvas = resizeCanvas(canvas, width, height);
    var ctx = canvas.getContext("2d");
    var imagedata = ctx.getImageData(0, 0, width, height);

    return imagedata;
  },

  isCat: function(vectors) {
    var features = hog.extractHOGFromVectors(vectors, this.HOGparams);

    var prob = net.runInput(features)[0];
    return prob;
  },

  detectAtScale: function(imagedata, scale) {
    // Detect using a sliding window of a fixed size.
    var vectors = hog.gradientVectors(imagedata);
    var cats = [];

    var width = imagedata.width,
        height = imagedata.height;

    var size = this.patchSize;

    for (var y = 0; y + size < height; y += this.shiftBy) {
      for (var x = 0; x + size < width; x += this.shiftBy) {
        var win = getRect(vectors, x, y, size, size);
        var prob = this.isCat(win);

        if (prob > this.threshold) {
          cats.push({
            x: Math.floor(x / scale),
            y: Math.floor(y / scale),
            width: Math.floor(size / scale),
            height: Math.floor(size / scale),
            prob: prob
          });
        }
      }
    }
    return cats;
  },

  combineOverlaps: function(rects, overlap, min) {
    // non-maximum suppression - remove overlapping rects
    overlap = overlap || this.overlapThresh;
    min = min || this.minOverlaps;

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
  overlap = overlap || 0.5;

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

  if (intersect / union > overlap) {
    return true;
  }
  return false;
}


module.exports = kittydar;
