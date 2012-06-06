var Canvas = require("canvas"),
    brain = require("brain"),
    hog = require("hog-descriptor"),
    features = require("./features");

var network = require("./network.json");
var net = new brain.NeuralNetwork().fromJSON(network);

var threshold = 0.9;

var kittydar = {
  detectCats: function(canvas) {
    var imagedata = canvas;
    if (imagedata.data) {
      // it's actually an ImageData object, put in canvas
      canvas = new Canvas(imagedata.width, imagedata.height);
      var ctx = canvas.getContext("2d");
      ctx.putImageData(imagedata, 0, 0);
    }

    var max = Math.max(canvas.width, canvas.height)
    var scale = Math.min(max, 360) / max;
    var width = Math.floor(canvas.width * scale);
    var height = Math.floor(canvas.height * scale);

    canvas = resizeCanvas(canvas, width, height);

    var min = 48; // starting window size

    var cats = [];
    for (var size = min; size < max; size += 12) {
      cats = cats.concat(this.detectAtSize(canvas, size, min));
    }

    cats = cats.map(function(cat) {
      return {
        x: Math.floor(cat.x / scale),
        y: Math.floor(cat.y / scale),
        width: Math.floor(cat.width / scale),
        height: Math.floor(cat.height / scale),
        prob: cat.prob
      }
    });

    return cats;
  },

  detectCatsYourself: function(canvas, callback) {
    // for use with Worker threads, callback gets called with imagedata
    // object you can send to thread to call detectAtFixed() on
    var imagedata = canvas;
    if (imagedata.data) {
      // it's actually an ImageData object, put in canvas
      canvas = new Canvas(imagedata.width, imagedata.height);
      var ctx = canvas.getContext("2d");
      ctx.putImageData(imagedata, 0, 0);
    }

    var max = Math.max(canvas.width, canvas.height)
    var scale = Math.min(max, 360) / max;
    var width = Math.floor(canvas.width * scale);
    var height = Math.floor(canvas.height * scale);

    canvas = resizeCanvas(canvas, width, height);

    var min = 48; // starting window size

    var cats = [];
    for (var size = min; size < max; size += 12) {
      var imagedata = this.resizeToFixed(canvas, size, min);
      callback(imagedata);
    }
  },

  resizeToFixed: function(canvas, size, fixed) {
    var scale = fixed / size;

    var width = Math.floor(canvas.width * scale);
    var height = Math.floor(canvas.height * scale);

    // resize the image so the fixed size can mimic window size
    canvas = resizeCanvas(canvas, width, height);
    var ctx = canvas.getContext("2d");
    var imagedata = ctx.getImageData(0, 0, width, height);

    return imagedata;
  },

  detectAtSize: function(canvas, size, fixed, callback) {
    var imagedata = this.resizeToFixed(canvas, size, fixed);

    var cats = this.detectAtFixed(imagedata, fixed, scale);
    return cats;
  },

  isCat: function(intensities) {
    var options = {
      "cellSize": 4,
      "blockSize": 2,
      "blockStride": 1,
      "bins": 6,
      "norm": "L2"
    };

    var fts = hog.extractHOGFromIntensities(intensities, options);
    var prob = net.run(fts)[0];
    return prob;
  },

  detectAtFixed: function(imagedata, fixed, scale) {
    // Only detect using a sliding window of a fixed size.
    // Take an ImageData instead of canvas so that this can be
    // used from a Worker thread.
    var intensities = hog.intensities(imagedata);
    var shift = 6;
    var cats = [];

    for (var y = 0; y + fixed < imagedata.height; y += shift) {
      for (var x = 0; x + fixed < imagedata.width; x += shift) {
        var win = getRect(intensities, x, y, fixed, fixed);
        var prob = this.isCat(win);

        if (prob > threshold) {
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
  }
}

function getRect2(matrix, x, y, width, height) {
  var square = new Array(height);
  for (var i = 0; i < height; i++) {
    square[i] = new Array(width);
    for (var j = 0; j < width; j++) {
      square[i][j] = matrix[y + i][x + j];
    }
  }
  return square;
}

function getRect(matrix, x, y, width, height) {
  matrix = matrix.slice(y, y + height);
  for (var i = 0; i < height; i++) {
    matrix[i] = matrix[i].slice(x, x + width)
  }
  return matrix;
}

function resizeCanvas(canvas, width, height) {
  var resizeCanvas = new Canvas(width, height);
  var ctx = resizeCanvas.getContext('2d');
  ctx.patternQuality = "best";

  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height,
                0, 0, width, height);
  return resizeCanvas;
}

module.exports = kittydar;
