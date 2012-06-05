var fs = require("fs"),
    brain = require("brain"),
    path = require("path"),
    async = require("async"),
    _ = require("underscore"),
    utils = require("../utils"),
    features = require("../features");

trainNetwork()

function trainNetwork(params) {
  getCanvases(function(canvases) {
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

    console.log("training with", data.length);

    var opts = {
      hiddenLayers: [30]
    };
    var trainOpts = {
      errorThresh: 0.006,
      log: true
    };

    var network = new brain.NeuralNetwork(opts);

    var stats = network.train(data, trainOpts);

    console.log("stats:", stats);
    console.log("parameters:", opts);

    var json = JSON.stringify(network.toJSON(), 4)

    fs.writeFile('network.json', json, function (err) {
      if (err) throw err;
      console.log('saved network to network.json');
    });
  })
}

function getCanvases(callback) {
  var posDir = __dirname + "/POSITIVES/";

  fs.readdir(posDir, function(err, files) {
    if (err) throw err;

    getDir(posDir, files, 1, 4000, 10000, function(posData) {
      var negsDir = __dirname + "/NEGATIVES/";
      fs.readdir(negsDir, function(err, files) {
        if (err) throw err;

        getDir(negsDir, files, 0, 8000, 16000, function(negData) {
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

  var data = [];

  async.map(images, function(file, done) {
    file = dir + file;

    utils.drawImgToCanvas(file, function(err, canvas) {
      done(null, {canvas: canvas, file: file, isCat: isCat});
    });
  },
  function(err, canvases) {
    console.log("got one directory of images");
    callback(canvases);
  });
}
