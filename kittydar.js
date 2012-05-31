var Canvas = require("canvas"),
    brain = require("brain"),
    features = require("./features");

var network = require("./network.json");
var net = new brain.NeuralNetwork().fromJSON(network);

var threshold = 0.9;

exports.detectCats = function detectCats(canvas) {
  var found = [];
  var minScale = 48;
  var maxScale = Math.min(canvas.width, canvas.height);

  var step = 14;
  var cats = [];
  var total = 0;
  for (var scale = minScale; scale < maxScale; scale += step) {
    var info = detectAtScale(canvas, scale, minScale);
    cats = cats.concat(info.cats);
    total += info.total;
  }
  return {cats: cats, total: total};
}

function isCat(canvas) {
  var fts = features.extractFeatures(canvas);
  var prob = net.run(fts)[0];
  return prob;
}

function detectAtScale(canvas, scale, resizeTo) {
  var shift = Math.floor(scale / 9);

  var cats = [];
  var count = 0;

  for (var y = 0; y + scale < canvas.height; y += shift) {
    for (var x = 0; x + scale < canvas.width; x += shift) {
      count++;
      var win = cropAndResize(canvas, x, y, scale, resizeTo);

      var prob = isCat(win);
      if (prob > threshold) {
        cats.push({ x: x, y: y, width: scale, height: scale, prob: prob });
      }
    }
  }
  return {cats: cats, total: count};
}

function cropAndResize(canvas, x, y, size, resizeTo) {
  var resizeCanvas = new Canvas(resizeTo, resizeTo);
  var ctx = resizeCanvas.getContext('2d');
  ctx.patternQuality = "best";

  ctx.drawImage(canvas, x, y, size, size, 0, 0, resizeTo, resizeTo);

  return resizeCanvas;
}
