var fs = require("fs"),
    path = require("path"),
    Canvas = require("canvas"),
    utils = require("../utils");

exports.collectImages = collectImages;
exports.getDir = getDir;

/*
 * Collect the canvas representations of the images in the positive and
 * negative directories and return
 * an array of objects that look like:
 * {
 *   canvas: <Canvas object>,
 *   file: 'test.jpg',
 *   iscat: true 
 * }
 */
function collectImages(posDir, negDir, samples, limit) {
  // number of samples to extract from each negative, 0 for whole image
  samples = samples || 0;

  // max number of images to collect per directory
  limit = limit || 1000;

  var pos = getDir(posDir, true, 0, limit);
  var neg = getDir(negDir, false, samples, limit);
  return pos.concat(neg);
}

function getDir(dir, isCat, samples, limit) {
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
      data.push({
        canvas: canvases[j],
        file: file,
        isCat: isCat ? 1 : 0
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