var Canvas = require("canvas"),
    brain = require("brain"),
    features = require("./features");

var network = require("./network.json");
var net = new brain.NeuralNetwork().fromJSON(network);

var threshold = 0.9;

exports.detectCats = function detectCats(canvas) {
  var width = canvas.width,
      height = canvas.height;

  // scale to reduce computation time
  var scale = 360 / Math.max(width, height);
  width = width * scale;
  height = height * scale;

  canvas = resizeCanvas(canvas, width, height);

  var min = 48;
  var max = Math.min(width, height);

  var cats = [];
  var total = 0;
  for (var size = min; size < max; size += 12) {
    var info = detectAtScale(canvas, size, min);
    cats = cats.concat(info.cats);
    total += info.total;
  }
  console.log(cats[0])
  console.log(scale)

  cats = cats.map(function(cat) {
    return {
      x: cat.x / scale,
      y: cat.y / scale,
      width: cat.width / scale,
      height: cat.height / scale,
      prob: cat.prob
    }
  });

  console.log(cats[0]);

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
