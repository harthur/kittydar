var fs = require("fs"),
    path = require("path"),
    nomnom = require("nomnom"),
    Canvas = require("canvas"),
    utils = require("../../utils");

var opts = nomnom.options({
  indir: {
    position: 0,
    default: __dirname + "/CAT_DATASET/",
    help: "Directory of cat pics from http://137.189.35.203/WebUI/CatDatabase/catData.html"
  },
  outdir: {
    position: 1,
    default: __dirname + "/POSITIVES/",
    help: "Directory to save rotated and cropped cat face images"
  }
}).colors().parse()

// Crop the cat head from each photo in cat dataset.
// Everything is sync to avoid OS fd limit
fs.readdir(opts.indir, function(err, files) {
  if (err) throw err;

  var images = files.filter(function(file) {
    return path.extname(file) == ".jpg";
  })

  console.log(images.length, "cat images");

  console.time("cropping");

  for (var i = 0; i < images.length; i++) {
    var file = images[i];
    var infile = opts.indir + "/" + file;
    var outfile = opts.outdir + "/" + path.basename(file, ".jpg") + ".png";

    cropFace(infile, outfile);

    if (i % 50 == 0) {
      console.log(i);
    }
  }

  console.timeEnd("cropping");
});

function cropFace(file, outfile) {
  var canvas = utils.drawImgToCanvasSync(file);

  var catfile = file + ".cat";
  var annotations = getCatDataSync(catfile);

  var processed = transformCanvas(canvas, annotations, file);

  utils.writeCanvasToFileSync(processed, outfile);
}

function getCatDataSync(file, callback) {
  // read special annotation file from cat dataset
  var text = fs.readFileSync(file, "utf-8");

  var vals = text.split(" ").map(parseFloat);
  var length = vals[0];
  if (length != 9) {
    console.log("different number of points:", length);
  }

  // locations of ears, eyes, and mouth
  var features = ["leye", "reye", "mouth", "lear1", "lear2",
                  "lear3", "rear1", "rear2", "rear3"];
  var points = {};
  for (var i = 0; i < length; i ++) {
    points[features[i]] = {
      x: vals[i * 2 + 1],
      y: vals[i * 2 + 2]
    }
  }

  return points;
}

function transformCanvas(canvas, points, file) {
  // Rotate and crop according to the shape detector training specifications in
  // "Cat Head Detection - How to Effectively Exploit Shape and Texture Features"
  // http://research.microsoft.com/pubs/80582/ECCV_CAT_PROC.pdf

  // if cat's head is turned more than 90deg
  var flipped = points.lear2.x > points.rear2.x;

  // find angle the face is tilted at
  var opp = points.rear2.y - points.lear2.y;
  var adj = points.rear2.x - points.lear2.x;
  if (flipped) {
    adj = -adj;
  }
  var hyp = Math.sqrt(Math.pow(opp, 2) + Math.pow(adj, 2));

  var angle = -Math.atan(opp / adj);

  var rotation = angle;
  if (flipped) {
    if (angle < 0) {
      rotation = Math.PI - angle;
    }
    else {
      rotation = Math.PI - angle;
    }
  }

  var length = 4/3 * hyp;  // length of final square canvas
  var drop = (5/12 * length);  // len from ears to center of face

  // make a new canvas that can fit rotated image
  var dim = canvas.width + canvas.height;
  var transCanvas = new Canvas(dim, dim);
  var ctx = transCanvas.getContext("2d");

  // will rotate on draw so tips of cat's ears are horizontal
  var half = dim / 2;
  ctx.translate(half, half);
  ctx.rotate(rotation);
  ctx.translate(-half, -half)

  var longOpp = Math.cos(angle) * drop;
  var longAdj = Math.sin(angle) * drop;

  var addX, addY;

  if (flipped) {
    addX = longAdj -(adj / 2);
    addY = -longOpp -(opp / 2);
  }
  else {
    addX = longAdj + (adj / 2);
    addY = longOpp - (opp / 2);
  }

  var centerX = points.lear2.x + addX;
  var centerY = points.rear2.y + addY;

  // draw image so center of cat's face is in the center of canvas
  ctx.drawImage(canvas, half - centerX, half - centerY);

  var cropCanvas = new Canvas(length, length);
  ctx = cropCanvas.getContext("2d");

  // crop and resize cat face
  var dim = hyp / 0.75;
  ctx.drawImage(transCanvas, half - (dim / 2), half - (dim / 2),
    dim, dim, 0, 0, length, length);

  return cropCanvas;
}
