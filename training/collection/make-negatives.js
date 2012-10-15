var fs = require("fs"),
    path = require("path"),
    nomnom = require("nomnom"),
    Canvas = require("canvas"),
    utils = require("../../utils");

var opts = nomnom.options({
  indir: {
    position: 0,
    default: __dirname + "/FLICKR/",
    help: "Directory of full-sizes negative images"
  },
  outdir: {
    position: 1,
    default: __dirname + "/NEGATIVES/",
    help: "Directory to save cropped image sections"
  },
  samples: {
    default: 1,
    help: "How many times to sub-sample each image"
  }
}).colors().parse();


fs.readdir(opts.indir, function(err, files) {
  if (err) throw err;

  var images = files.filter(function(file) {
    return path.extname(file) == ".jpg";
  });

  console.log(images.length, "images to process");

  images.forEach(function(image) {
    var file = opts.indir + "/" + image;
    try {
      var canvas = utils.drawImgToCanvasSync(file);
    }
    catch(e) {
      console.log(e, file);
      return;
    }
    var canvases = extractSamples(canvas, opts.samples);

    canvases.forEach(function(canvas) {
      var name = Math.floor(Math.random() * 10000000000);
      var file = opts.outdir + "/" + name + ".jpg";

      utils.writeCanvasToFileSync(canvas, file);
    });
  });
})

function extractSamples(canvas, num) {
  var min = 48;
  var max = Math.min(canvas.width, canvas.height);

  var canvases = [];
  for (var i = 0; i < num; i++) {
    var length = Math.max(48, Math.ceil(Math.random() * max));

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
