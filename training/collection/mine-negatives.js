var fs = require("fs"),
    path = require("path"),
    brain = require("brain"),
    async = require("async"),
    _ = require("underscore"),
    features = require("../../features"),
    utils = require("../../utils");

var trained = require("./network.json");

var dir = __dirname + "/NEGS_RAW_SAMPLED/";
var minedDir = __dirname + "/HARD_NEGS/";

var start = 0;
var count = 0;

var part = parseInt(process.argv[2]);

console.log("mining hard negatives from part", part);

fs.readdir(dir, function(err, files) {
  if (err) throw err;

  var images = files.filter(function(file) {
    return path.extname(file) == ".jpg";
  });

  // to get around open fd limit
  images = images.slice(9000 * part, 9000 * (part + 1));

  console.log(images.length)

  async.map(images, function(file, done) {
    file = dir + file;

    utils.drawImgToCanvas(file, function(err, canvas) {
      done(null, {
        canvas: canvas,
        file: file,
        isCat: false,
        err: err
      });
    });
  },
  function(err, canvases) {
    saveFalsePos(canvases);
  });
})

function saveFalsePos(canvases) {
  canvases = canvases.filter(function(canvas) {
    return !canvas.err;
  });

  var data = canvases.map(function(canvas) {
    var fts = features.extractFeatures(canvas.canvas);
    return {
      file: canvas.file,
      input: fts,
      output: [canvas.isCat]
    };
  });

  data = _(data).sortBy(function() {
    return Math.random();
  });

  var network = new brain.NeuralNetwork().fromJSON(trained);

  var stats = network.test(data);

  console.log(stats.misclasses.length, "misclasses")
  console.log(stats.falsePos, "false positives");
  console.log(stats.trueNeg, "true negatives");
  console.log(stats.total, "total");

  stats.misclasses.forEach(function(misclass) {
    if (misclass.expected == 0) {
      var file = minedDir + path.basename(misclass.file);
      copyFile(misclass.file, file);
    }
  });
}


function copyFile(source, dest, callback) {
  newFile = fs.createWriteStream(dest);
  oldFile = fs.createReadStream(source);
  oldFile.pipe(newFile);

  oldFile.on('end', function() {
    if (callback) callback();
  })
}