var brain = require("brain"),
    fs = require("fs"),
    path = require("path"),
    util = require("util"),
    utils = require("../../utils");

var trained = require("./network.json");

var dir = __dirname + "/NEGS_RAW_SAMPLED/";
var minedDir = __dirname + "/HARD_NEGS/"

var start = 0;
var count = 0;

var iter = 0;

fs.readdir(dir, function(err, files) {
  if (err) throw err;

  var images = file.filter(function(file) {
    return path.extname(file) == ".jpg";
  });

  images = images.slice(9000 * iter, 9000 * (iter + 1));


  async.map(images, function(file, done) {
    file = dir + file;

    utils.drawImgToCanvas(file, function(canvas) {
      done(null, {canvas: canvas, file: file, isCat: isCat});
    });
  },
  function(err, canvases) {
    saveFalsePos(canvases);
  });
})

function saveFalsePos(canvases) {
  var data = canvases.map(function(canvas) {
    var fts = features.extractFeatures(canvas.canvas, params);
    return {
      file: canvas.file
      input: fts,
      output: [canvas.isCat]
    };
  });

  data = _(data).sortBy(function() {
    return Math.random();
  });

  var network = new brain.NeuralNetwork().fromJSON(trained);

  var stats = network.test(data);

  console.log(stats.falsPos, "false positives");

  stats.misclasses.forEach(function(misclass) {
    if (misclass.expected == 0) {
      var file = path.basename(misclass.file);
      newFile = fs.createWriteStream(misclass.file);
      oldFile = fs.createReadStream(minedDir + file);
      util.pump(oldFile, newFile);
    }
  });
}

