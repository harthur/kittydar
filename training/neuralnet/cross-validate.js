var fs = require("fs"),
    path = require("path"),
    nomnom = require("nomnom"),
    brain = require("brain"),
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
  sample: {
    flag: true,
    help: "Sub-sample negative images"
  },
  limit: {
    default: 10000,
    help: "Max images to collect from each directory"
  }
}).colors().parse();


var combos = [
{
  HOG: {
    cellSize: 4,
    blockSize: 3,
    blockStride: 3,
    bins: 6,
    norm: "L2"
  },
  nn: {
    hiddenLayers: [10, 10],
    binaryThresh: 0.99
  },
  train: {
    errorThresh: 0.008
  }
},
{
  HOG: {
    cellSize: 3,
    blockSize: 4,
    blockStride: 4,
    bins: 6,
    norm: "L2"
  },
  nn: {
    hiddenLayers: [10, 10],
    binaryThresh: 0.99
  },
  train: {
    errorThresh: 0.008
  }
}
];

console.log("testing", combos.length, "combinations");

testAll(combos);

function testAll(combos) {
  var tests = [];

  for (var i = 0; i < combos.length; i++) {
    var params = combos[i];
    var samples = opts.sample ? 1 : 0;
    var data = collect.collectData(opts.pos, opts.neg, samples,
                                   opts.limit, opts.limit, params);

    console.log("testing", i + 1 + ": " + JSON.stringify(params), "on " + data.length)

    var stats = testParams(data, params);
    var test = {
      params: params,
      featureSize: stats.featureSize,
      avgs: stats.avgs,
      stats: stats.stats
    };
    tests.push(test);

    console.log(test);

    if (i == combos.length - 1) {
      console.log("\n" + getPrintout(tests));

      fs.writeFile('tests.json', JSON.stringify(tests, 4), function (err) {
        if (err) throw err;
        console.log('saved tests to tests.json');
      });
    }
  }
}

function testParams(data, params) {
  var trainOpts = params.train;
  trainOpts.log = true;

  var stats = brain.crossValidate(brain.NeuralNetwork, data,
                                  params.nn, trainOpts);
  stats.featureSize = data[0].input.length;
  return stats;
}

function getPrintout(tests) {
  tests.sort(function(test1, test2) {
    return test1.stats.falsePos > test2.stats.falsePos;
  });
  var lines = tests.map(function(test) {
    return JSON.stringify(test.params) + " "
      + "size: " + test.featureSize + " "
      + "p: " + test.stats.precision.toFixed(3) + " "
      + "r: " + test.stats.recall.toFixed(3) + " "
      + "a: " + test.stats.accuracy.toFixed(3) + " "
      + "fp: " + test.stats.falsePos;
  });
  return lines.join("\n");
}
