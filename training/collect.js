var fs = require("fs"),
    path = require("path"),
    Canvas = require("canvas"),
    utils = require("../utils")
    features = require("./features");

exports.collectData = collectData;
exports.extractSamples = extractSamples;

/*
 * Collect the canvas representations of the images in the positive and
 * negative directories and return
 * an array of objects that look like:
 * {
 *  input: <Array of floats> from image features
 *  output: [0,1] (depending if it's a cat or not)
 *  file: 'test.jpg'
 * }
 */
function collectData(pos, neg, samples, posLimit, negLimit, params) {
  // number of samples to extract from each negative, 0 for whole image
  samples = samples || 0;
  params = params || {};

  var data = [];
  for (var i = 0; i < pos.length; i++) {
    data = data.concat(getDir(pos[i], true, 0, posLimit, params));
  }
  for (var i = 0; i < neg.length; i++) {
    data = data.concat(getDir(neg[i], false, samples, negLimit, params));
  }

  // randomize so neural network doesn't get biased toward one set
  data.sort(function() {
    return 1 - 2 * Math.round(Math.random());
  });
  return data;
}

function getDir(dir, isCat, samples, limit, params) {
  var files = fs.readdirSync(dir);

  var images = files.filter(function(file) {
    return (path.extname(file) == ".png"
         || path.extname(file) == ".jpg");
  });

  images = images.slice(0, limit);

  var data = [];
  for (var i = 0; i < images.length; i++) {
    var file = dir + "/" + images[i];
    try {
      var canvas = utils.drawImgToCanvasSync(file);
    }
    catch(e) {
      console.log(e, file);
      continue;
    }

    var canvases = extractSamples(canvas, samples);

    for (var j = 0; j < canvases.length; j++) {
      var fts;
      try {
        fts = features.extractFeatures(canvases[j], params.HOG);
      } catch(e) {
        console.log("error extracting features", e, file);
        continue;
      }
      data.push({
        input: new Float64Array(fts),
        output: [isCat ? 1 : 0],
        file: file,
      });
    }
  }

  return data;
}


function extractSamples(canvas, num) {
  if (num == 0) {
    // 0 means "don't sample"
    return [canvas];
  }

  var min = 48;
  var max = Math.min(canvas.width, canvas.height);

  var canvases = [];
  for (var i = 0; i < num; i++) {
    var length = Math.max(min, Math.ceil(Math.random() * max));

    var x = Math.floor(Math.random() * (max - length));
    var y = Math.floor(Math.random() * (max - length));

    canvases.push(cropCanvas(canvas, x, y, length, length));
  }
  return canvases;
}

function cropCanvas(canvas, x, y, width, height) {
  var cropCanvas = new Canvas(width, height);
  var context = cropCanvas.getContext("2d");
  context.drawImage(canvas, x, y, width, height, 0, 0, width, height);
  return cropCanvas;
}