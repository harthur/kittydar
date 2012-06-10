var fs = require("fs"),
    path = require("path"),
    brain = require("brain"),
    async = require("async"),
    _ = require("underscore"),
    features = require("../features"),
    utils = require("../utils");

testNetwork({
  cellSize: 4
})

function testNetwork(params) {
  getCanvases(function(canvases) {
    canvases = canvases.filter(function(canvas) {
      return !canvas.err;
    })

    var data = canvases.map(function(canvas) {
      var fts = features.extractFeatures(canvas.canvas, params);
      return {
        input: fts,
        output: [canvas.isCat]
      };
    });

    data = _(data).sortBy(function() {
      return Math.random();
    });

    console.log("testing with", data.length);

    var json = require("./network-4-big.json")
    var network = new brain.NeuralNetwork().fromJSON(json);
    var stats = network.test(data);

    console.log(stats.error, "error");
    console.log(stats.precision, "precision")
    console.log(stats.recall, "recall")
    console.log(stats.accuracy, "accuracy")

    console.log(stats.truePos, "true positives");
    console.log(stats.trueNeg, "true negatives");
    console.log(stats.falsePos, "false positives");
    console.log(stats.falseNeg, "false negatives");
    console.log(stats.total, "total");
  })
}

function getCanvases(callback) {
  var posDir = __dirname + "/POSITIVES_TEST/";

  fs.readdir(posDir, function(err, files) {
    if (err) throw err;

    getDir(posDir, files, 1, 0, 8000, function(posData) {
      var negsDir = __dirname + "/NEGATIVES_TEST/";
      fs.readdir(negsDir, function(err, files) {
        if (err) throw err;

        getDir(negsDir, files, 0, 0, 6000, function(negData) {
          var data = posData.concat(negData);

          callback(data);
        })
      })
    })
  });
}

function getDir(dir, files, isCat, min, limit, callback) {
  var images = files.filter(function(file) {
    return path.extname(file) == ".jpg";
  });
  images = images.slice(min, limit);

  console.log(images.length)

  var data = [];

  async.map(images, function(file, done) {
    file = dir + file;

    utils.drawImgToCanvas(file, function(err, canvas) {
      if (err) {
        console.log(err);
      }
      done(null, {canvas: canvas, file: file, isCat: isCat, err: err});
    });
  },
  function(err, canvases) {
    console.log("got one directory of images");
    callback(canvases);
  });
}
