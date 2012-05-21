var hog = require("hog-descriptor"),
    Canvas = require("canvas"),
    brain = require("brain"),
    utils = require("./utils"),
    network = require("./cv-network.json");

var threshold = 0.95;

var cropsdir = "/CROPS/"

var net = new brain.NeuralNetwork().fromJSON(network);

exports.detectCats = function detectCats(canvas) {
  var found = [];
  var minScale = 48;
  var maxScale = Math.min(canvas.width, canvas.height);

  var step = 10;
  var cats = [];
  for (var scale = minScale; scale < maxScale; scale += step) {
    var detected = detectAtScale(canvas, scale, minScale);
    cats = cats.concat(detected)
  }

  return cats;
}

function catProb(canvas) {
  var descriptor = hog.extractHOG(canvas, {
    cellSize: 6,
    blockSize: 2,
    bins: 6,
    norm: "L2"
  });

  var prob = net.run(descriptor)[0];
  return prob;
}

function detectAtScale(canvas, scale, resizeTo) {
  console.log("\n\ndetecting at", scale, "px");

  var shift = Math.floor(scale / 10);   // 8

  var cats = [];
  var count = 0;
  for (var y = 0; y + scale < canvas.height; y += shift) {
    for (var x = 0; x + scale < canvas.width; x += shift) {
      count++;
      var win = cropAndResize(canvas, x, y, scale, resizeTo);
      var prob = catProb(win);

      //console.log("testing at", x, y, "prob:", prob, "scale:", scale);
      if (prob > threshold) {
        saveCrop(win, x, y, scale, prob);

        console.log("prob", prob, "detected at", scale, "px", "x:", x, "y:", y);
        cats.push({ x: x, y: y, width: scale, height: scale });
      }
    }
  }
  console.log(count)
  return cats;
}

function saveCrop(canvas, x, y, scale, prob) {
  var file = __dirname + cropsdir + x + "_" + y + "_" + scale + "_" + prob.toFixed(2) + ".jpg"
  utils.writeCanvasToFile(canvas, file, function(err) {
    //console.log(err)
  });
}

function cropAndResize(canvas, x, y, size, resizeTo) {
  var resizeCanvas = new Canvas(resizeTo, resizeTo);
  var ctx = resizeCanvas.getContext('2d');
  ctx.patternQuality = "best";

  ctx.drawImage(canvas, x, y, size, size, 0, 0, resizeTo, resizeTo);

  return resizeCanvas;
}
