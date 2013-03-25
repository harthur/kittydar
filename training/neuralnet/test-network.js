var fs = require("fs"),
    path = require("path"),
    brain = require("brain"),
    nomnom = require("nomnom"),
    params = require("./params"),
    utils = require("../../utils"),
    collect = require("../collect");

var opts = nomnom.options({
  pos: {
    abbr: 'p',
    list: true,
    required: true,
    help: "Directory of test positive images"
  },
  neg: {
    abbr: 'n',
    list: true,
    required: true,
    help: "Directory of test negative images"
  },
  json: {
    default: __dirname + "/network.json",
    help: "Neural network JSON file"
  },
  sample: {
    flag: true,
    help: "sub-sample the negative images"
  },
  threshold: {
    default: 0.99,
    help: "threshold for classifying as a positive"
  }
}).colors().parse();

testNetwork();

function testNetwork() {
  var data = collect.collectData(opts.pos, opts.neg, opts.sample ? 1 : 0, undefined,
                                 undefined, params);
  console.log("testing on", data.length);

  console.log("feature size", data[0].input.length);

  var json = require(opts.json);
  var network = new brain.NeuralNetwork({
    binaryThresh: opts.threshold
  }).fromJSON(json);

  var stats = network.test(data);

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
