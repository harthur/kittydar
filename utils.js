var url = require("url"),
    fs = require("fs"),
    http = require("http"),
    Canvas = require("canvas");

exports.dataToCanvas = function(imagedata) {
  img = new Canvas.Image();
  img.src = new Buffer(imagedata, 'binary');

  var canvas = new Canvas(img.width, img.height);
  var ctx = canvas.getContext('2d');
  ctx.patternQuality = "best";

  ctx.drawImage(img, 0, 0, img.width, img.height,
    0, 0, img.width, img.height);
  return canvas;
}

exports.drawImgToCanvas = function(file, callback) {
  fs.readFile(file, function(err, data) {
    if (err) {
      return callback(err);
    }
    try {
      var canvas = exports.dataToCanvas(data);
    } catch(err) {
      return callback(err);
    }
    callback(null, canvas);
  });
}

exports.drawImgToCanvasSync = function(file) {
  var data = fs.readFileSync(file);
  if (!data.length) {
    throw "empty file";
  }
  var canvas = exports.dataToCanvas(data);
  return canvas;
}

exports.writeCanvasToFile = function(canvas, file, callback) {
  var buffer = canvas.toBuffer(); // png data
  fs.writeFile(file, buffer, callback);
}

exports.writeCanvasToFileSync = function(canvas, file) {
  var buffer = canvas.toBuffer(); // png data
  fs.writeFileSync(file, buffer);
}

exports.saveImgToFile = function(file, imagedata) {
  fs.writeFile(file, imagedata, 'binary', function(err) {
    if (err) throw err;
  })
}

exports.resizeCanvas = function(canvas, width, height) {
  var resizeCanvas = new Canvas(width, height);
  var ctx = resizeCanvas.getContext('2d');
  ctx.patternQuality = "best";

  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height,
                0, 0, width, height);

  return resizeCanvas;
}
