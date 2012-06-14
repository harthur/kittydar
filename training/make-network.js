var fs = require("fs"),
    brain = require("brain"),
    path = require("path"),
    async = require("async"),
    _ = require("underscore"),
    utils = require("../utils"),
    features = require("../features");

var networkFile = __dirname + "/network-june13-6.json";

console.log("training with 6 pixels per cell mainly hard");
trainNetwork({
  cellSize: 6
})

function trainNetwork(params) {
  getCanvases(function(canvases) {
    canvases = canvases.filter(function(canvas) {
      return !canvas.err;
    })

    var data = canvases.map(function(canvas) {
      try {
      var fts = features.extractFeatures(canvas.canvas, params);
      } catch(e) {
        console.log("err getting features", e, canvas.file);
      }
      return {
        input: fts,
        output: [canvas.isCat]
      };
    });

    data = _(data).sortBy(function() {
      return Math.random();
    });

    console.log(data[0].input.length)

    console.log("training with", data.length);

    var opts = {
      hiddenLayers: [30]
    };
    var trainOpts = {
      errorThresh: 0.005,
      log: true,
      logPeriod: 1
    };

    var network = new brain.NeuralNetwork(opts);

    var stats = network.train(data, trainOpts);

    console.log("stats:", stats);
    console.log("parameters:", opts);

    var json = JSON.stringify(network.toJSON(), 4)

    fs.writeFile(networkFile, json, function (err) {
      if (err) throw err;
      console.log('saved network to', networkFile);
    });
  })
}

function getCanvases(callback) {
  var posDir = __dirname + "/POSITIVES/";

  fs.readdir(posDir, function(err, files) {
    if (err) throw "pos" + err;

    getDir(posDir, files, 1, 0, 9500, function(posData) {
      var negsDir = __dirname + "/NEGS_ALL/";
      fs.readdir(negsDir, function(err, files) {
        if (err) throw "neg" + err;

        getDir(negsDir, files, 0, 0, 9500, function(negData) {
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
        console.log(err, file);
      }
      done(null, {canvas: canvas, file: file, isCat: isCat, err: err});
    });
  },
  function(err, canvases) {
    callback(canvases);
  });
}
