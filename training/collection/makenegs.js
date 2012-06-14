var http = require("http"),
    url = require("url"),
    fs = require("fs"),
    async = require("async"),
    path = require("path"),
    Canvas = require("canvas"),
    _ = require("underscore"),
    utils = require("../../utils");

var dir = __dirname + "/NEGS_FLICKR/";
var outdir = __dirname + "/NEGS_SAMPLED3/";

var part = parseInt(process.argv[2]);

var perFile = 1;

fs.readdir(dir, function(err, files) {
  if (err) throw err;

  var images = files.filter(function(file) {
    return path.extname(file) == ".jpg";
  });

  images = images.slice(9500 * part, 9500 * (part + 1));
  console.log(images.length);

  images.forEach(function(image) {
    try {
      var canvas = utils.drawImgToCanvasSync(dir + image);
    }
    catch(e) {
      console.log(e, dir + image);
      return;
    }
    var canvases = generateFromRaw(canvas);

    canvases.forEach(function(canvas) {
      var name = Math.floor(Math.random() * 10000000000);
      var file = outdir + name + ".jpg";

      utils.writeCanvasToFile(canvas, file, function() {
        console.log("wrote to", file)
      });
    });
  });
})

function generateFromRaw(canvas) {
  var min = 48;
  var max = Math.min(canvas.width, canvas.height);

  var canvases = _.range(0, perFile).map(function() {
    var length = Math.max(48, Math.ceil(Math.random() * max));

    var x = Math.floor(Math.random() * (max - length));
    var y = Math.floor(Math.random() * (max - length));

    return cropCanvas(canvas, x, y, length, length);
  })
  return canvases;
}

function cropCanvas(canvas, x, y, width, height) {
  var cropCanvas = new Canvas(width, height);
  var context = cropCanvas.getContext("2d");
  context.drawImage(canvas, x, y, width, height, 0, 0, width, height);
  return cropCanvas;
}
