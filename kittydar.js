var Canvas = require("canvas"),
    brain = require("brain"),
    hog = require("hog-descriptor"),
    features = require("./features");

var network = require("./network.json");
var net = new brain.NeuralNetwork().fromJSON(network);

var threshold = 0.9;

exports.detectCats = function detectCats(canvas) {
  var imagedata = canvas;
  if (imagedata.data && imagedata.width && imagedata.height) {
    // it's actually an imagedata object
    canvas = new Canvas(imagedata.width, imagedata.height);
    var ctx = canvas.getContext("2d");
    ctx.putImageData(imagedata, 0, 0);
  }

  var width = canvas.width;
  var height = canvas.height;

  var max = Math.max(width, height)
  var scale = Math.min(max, 360) / max;

  width *= scale;
  height *= scale;

  canvas = resizeCanvas(canvas, width, height);

  var min = 48; // starting window size

  var cats = [];
  for (var size = min; size < max; size += 12) {
    cats = cats.concat(detectAtSize(canvas, size, min));
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
}

function detectAtSize(canvas, size, fixed) {
  var scale = fixed / size;

  var width = Math.floor(canvas.width * scale);
  var height = Math.floor(canvas.height * scale);

  canvas = resizeCanvas(canvas, width, height);
  var ctx = canvas.getContext("2d");
  var imagedata = ctx.getImageData(0, 0, width, height);

  var cats = detectAtFixed(imagedata, fixed, scale);
  return cats;
}

function isCat(intensities) {
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
}

function detectAtFixed(imagedata, fixed, scale) {
  console.log("detect at fixed", fixed, scale);
  var shift = 6;

  var intensities = hog.intensities(imagedata);

  var cats = [];

  for (var y = 0; y + fixed < imagedata.height; y += shift) {
    for (var x = 0; x + fixed < imagedata.width; x += shift) {
      var win = getRect(intensities, x, y, fixed, fixed);
      var prob = isCat(win);

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

function getIntensities(elements, x, y, size, bins) {
  var histogram = zeros(bins);

  for (var i = 0; i < size; i++) {
    for (var j = 0; j < size; j++) {
      var vector = elements[y + i][x + j];
      var bin = binFor(vector.orient, bins);
      histogram[bin] += vector.mag;
    }
  }
  return histogram;
}




function resizeCanvas(canvas, width, height) {
  var resizeCanvas = new Canvas(width, height);
  var ctx = resizeCanvas.getContext('2d');
  ctx.patternQuality = "best";

  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height,
                0, 0, width, height);
  return resizeCanvas;
}

function cropAndResize(canvas, x, y, size, resizeTo) {
  var resizeCanvas = new Canvas(resizeTo, resizeTo);
  var ctx = resizeCanvas.getContext('2d');
  ctx.patternQuality = "best";

  ctx.drawImage(canvas, x, y, size, size, 0, 0, resizeTo, resizeTo);

  return resizeCanvas;
}
