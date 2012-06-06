var Canvas = require("canvas"),
    brain = require("brain"),
    hog = require("hog-descriptor"),
    features = require("./features");

var network = require("./network.json");
var net = new brain.NeuralNetwork().fromJSON(network);

var threshold = 0.9;

var kittydar = {
  detectCats: function(canvas) {
    var min = 48;
    var resizes = this.getAllSizes(canvas, min);

    var cats = [];
    resizes.forEach(function(resize) {
      var detected = kittydar.detectAtFixed(resize.imagedata,
                                            min, resize.scale);
      cats = cats.concat(detected);
    });
    return cats;
  },

  getAllSizes: function(canvas, fixed) {
    // for use with Worker threads, return canvas ImageDatas
    // resized to accomodate various window sizes

    // smallest window size
    fixed = fixed || 48;

    // resize canvas to cut down on number of windows to check
    var resize = 360;
    var max = Math.max(canvas.width, canvas.height)
    var scale = Math.min(max, resize) / max;

    var resizes = [];
    for (var size = fixed; size < max; size += 12) {
      var winScale = (fixed / size) * scale;
      var imagedata = this.resizeToFixed(canvas, winScale);

      resizes.push({
        imagedata: imagedata
        scale: winScale
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
  var resizeCanvas = new Canvas(width, height);
  var ctx = resizeCanvas.getContext('2d');
  ctx.patternQuality = "best";

  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height,
                0, 0, width, height);
  return resizeCanvas;
}

module.exports = kittydar;
