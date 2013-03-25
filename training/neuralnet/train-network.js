var fs = require("fs"),
    brain = require("brain"),
    path = require("path"),
    nomnom = require("nomnom"),
    utils = require("../../utils"),
    collect = require("../collect");

var opts = nomnom.options({
  pos: {
    abbr: 'p',
    list: true,
    required: true,
    help: "Directory of cat head images"
  },
  neg: {
    abbr: 'n',
    list: true,
    required: true,
    help: "Directory of negative images"
  },
  testPos: {
    list: true,
    help: "Directory of positive test images"
  },
  testNeg: {
    list: true,
    help: "Directory of negative test images"
  },
  outfile: {
    default: __dirname + "/network.json",
    help: "file to save network JSON to"
  },
  sample: {
    flag: true,
    help: "whether to sub-sample the negative images",
    hidden: true
  },
  posLimit: {
    default: 10000,
    help: "maximum number of positive images to use"
  },
  negLimit: {
    default: 10000,
    help: "maximum number of negative images to use"
  }
}).colors().parse();

var params = {
  HOG: {
    cellSize: 4,
    blockSize: 2,
    blockStride: 1,
    bins: 6,
    norm: "L2"
  },
  nn: {
    hiddenLayers: [10, 10],
    learningRate: 0.2
  },
  train: {
    errorThresh: 0.008,
    log: true,
    logPeriod: 1
  }
};

trainNetwork(params)

function trainNetwork(params) {
  var samples = opts.sample ? 1 : 0;
  var data = collect.collectData(opts.pos, opts.neg, samples,
                                 opts.posLimit, opts.negLimit, params);

  console.log("training on", data.length);
  console.log("feature size:", data[0].input.length)

  var network = new brain.NeuralNetwork(params.nn);

  var stats = network.train(data, params.train);

  console.log("stats:", stats);
  console.log("parameters:", params);

  var json = JSON.stringify(network.toJSON(), 4)

  fs.writeFile(opts.outfile, json, function (err) {
    if (err) throw err;
    console.log('saved network to', opts.outfile);
  });

  if (opts.testPos && opts.testNeg) {
    testNetwork(network);
  }
}

function testNetwork(network) {
  var data = collect.collectData(opts.testPos, opts.testNeg, opts.sample ? 1 : 0,
                                 undefined, undefined, params);
  console.log("testing on", data.length);
  console.log("feature size", data[0].input.length);

  console.time("TEST");

  var stats = network.test(data);

  console.timeEnd("TEST");

  console.log("error:     " + stats.error);
  console.log("precision: " + stats.precision)
  console.log("recall:    " + stats.recall)
  console.log("accuracy:  " + stats.accuracy)

  console.log(stats.truePos + " true positives");
  console.log(stats.trueNeg + " true negatives");
  console.log(stats.falsePos + " false positives");
  console.log(stats.falseNeg + " false negatives");
  console.log(stats.total + " total");
}
