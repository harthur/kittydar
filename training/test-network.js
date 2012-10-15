var fs = require("fs"),
    path = require("path"),
    brain = require("brain"),
    async = require("async"),
    _ = require("underscore"),
    nomnom = require("nomnom"),
    features = require("../features"),
    utils = require("../utils"),
    collect = require("./collect");

var opts = nomnom.options({
  posDir: {
    position: 0,
    default: __dirname + "/collection/POSITIVES_TEST/",
    help: "Directory of test positives"
  },
  negDir: {
    position: 1,
    default: __dirname + "/collection/NEGATIVES_TEST/",
    help: "Directory of test negatives"
  },
  network: {
    default: __dirname + "/network.json",
    help: "Neural network JSON file"
  },
  sample: {
    default: true,
    help: "sub-sample the negative images"
  }
}).colors().parse();

testNetwork();

function testNetwork() {
  var canvases = collect.collectImages(opts.posDir, opts.negDir,
                                       opts.sample ? 1 : 0);
  console.log("testing on", canvases.length);

  var data = canvases.map(function(canvas) {
    try {
      var fts = features.extractFeatures(canvas.canvas);
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

  console.log("testing with", data.length);

  var json = require(opts.network)
  var network = new brain.NeuralNetwork().fromJSON(json);
  var stats = network.test(data);

  console.log(stats.error + " error");
  console.log(stats.precision + " precision")
  console.log(stats.recall + " recall")
  console.log(stats.accuracy + " accuracy")

  console.log(stats.truePos + " true positives");
  console.log(stats.trueNeg + " true negatives");
  console.log(stats.falsePos + " false positives");
  console.log(stats.falseNeg + " false negatives");
  console.log(stats.total + " total");
}
