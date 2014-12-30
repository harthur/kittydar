var fs = require("fs"),
    path = require("path"),
    Canvas = require("canvas"),
    utils = require("../utils"),
    convnet = require("convnetjs"),
    features = require("./features");

exports.collectData = collectData;
exports.extractSamples = extractSamples;

var SIZE = 48;

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

    // For negatives, we might sample the image multiple times
    // For positives, samples=0
    var canvases = extractSamples(canvas, samples);

    for (var j = 0; j < canvases.length; j++) {
      var fts;
      if (params.getRawPixels) {
        var trainingCanvas = utils.resizeCanvas(canvases[j], SIZE, SIZE);
        fts = getConvNetVol(trainingCanvas, params.greyscalePixels);
      }
      else {
        try {
          fts = features.extractFeatures(canvases[j], params.HOG);
          fts = new Float64Array(fts)
        } catch(e) {
          console.log("error extracting features", e, file);
          continue;
        }
      }

      data.push({
        input: fts,
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

/**
 * For convolutional neural nets, the features we get from the data is
 * just the raw pixels. Here we get the raw pixels in a format that
 * the convnetjs library can understand.
 */
function getConvNetVol(canvas, toGrayscale) {
  var ctx = canvas.getContext("2d");
  var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  var W = canvas.width;
  var H = canvas.height;
  var pixels = [];
  for (var i = 0; i < data.length; i++) {
    pixels.push(data[i] / 255 - 0.5); // normalize image pixels to [-0.5, 0.5]
  }
  var vol = new convnet.Vol(W, H, 4, 0); //input volume (image)
  vol.w = pixels;

  if (toGrayscale) {
    var grayVol = new convnet.Vol(W, H, 1, 0);
    for (var i = 0; i < W; i++) {
      for (var j = 0; j < H; j++) {
        grayVol.set(i, j, 0, vol.get(i, j, 0));
      }
    }
    return grayVol;
  }
  return vol;
}
