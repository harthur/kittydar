var fs = require("fs"),
    brain = require("brain"),
    path = require("path"),
    async = require("async"),
    _ = require("underscore"),
    utils = require("../utils"),
    features = require("../features");


testParams({
  cellSize: 4
});

function testParams(params) {
  getCanvases(function(canvases) {
    canvases = canvases.filter(function(canvas) {
      return canvas.err === null;
    });

    var data = canvases.map(function(canvas) {
      var fts = features.extractFeatures(canvas.canvas, params);
      return {
        file: canvas.file,
        input: fts,
        output: [canvas.isCat]
      };
    });

    console.log("training on", data.length)

    var opts = {
      hiddenLayers: [2]
    };
    var trainOpts = {
      errorThresh: 0.006,
      log: true
    };

    var stats = brain.crossValidate(brain.NeuralNetwork, data, opts, trainOpts);
    stats.featureSize = data[0].input.length;

    console.log("params", stats.params);
    console.log("stats", stats.stats);
    console.log("avgs", stats.avgs);

    fs.writeFile('misclasses.json', JSON.stringify(stats.misclasses, 4), function (err) {
      if (err) throw err;
      console.log('saved misclasses to misclasses.json');
    });

    var minError = 1;
    var network;

    stats.sets.forEach(function(set) {
      if (set.error < minError) {
        minError = set.error;
        network = set.network;
      }
    })

    var json = JSON.stringify(network, 4)
    fs.writeFile('cv-network.json', json, function (err) {
      if (err) throw err;
      console.log('saved network to cv-network.json');
    });
  })
}

function getCanvases(callback) {
  var posDir = __dirname + "/POSITIVES_TRAIN/";

  fs.readdir(posDir, function(err, files) {
    if (err) throw err;

    getDir(posDir, files, 1, function(posData) {
      var negsDir = __dirname + "/NEGATIVES_MIXED/";
      fs.readdir(negsDir, function(err, files) {
        if (err) throw err;

        getDir(negsDir, files, 0, function(negData) {
          var data = posData.concat(negData);

          callback(data);
        })
      })
    })
  });
}

function getDir(dir, files, isCat, callback) {
  var limit = 5000;
  var images = files.filter(function(file) {
    return path.extname(file) == ".jpg";
  });
  images = images.slice(0, limit);

  var data = [];

  async.map(images, function(file, done) {
    file = dir + file;

    utils.drawImgToCanvas(file, function(err, canvas) {
      done(null, {canvas: canvas, file: file, isCat: isCat, err: err});
    });
  },
  function(err, canvases) {
    console.log("got one directory of images")
    callback(canvases);
  });
}
