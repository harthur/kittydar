var fs = require("fs"),
    path = require("path"),
    nomnom = require("nomnom"),
    svm = require("svm"),
    utils = require("../../utils"),
    _ = require("underscore"),
    collect = require("../collect");

var opts = nomnom.options({
  pos: {
    abbr: 'p',
    list: true,
    required: true,
    help: "Directory of positive training images"
  },
  neg: {
    abbr: 'n',
    list: true,
    required: true,
    help: "Directory of negative training images"
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
    blockSize: 2,
    blockStride: 1,
    bins: 7,
    norm: "L2"
  },
  svm: {
    numpasses: 5,
    C: 0.001,
  }
},
{
  HOG: {
    cellSize: 4,
    blockSize: 2,
    blockStride: 1,
    bins: 9,
    norm: "L2"
  },
  svm: {
    numpasses: 5,
    C: 0.001,
  }
},
{
  HOG: {
    cellSize: 4,
    blockSize: 2,
    blockStride: 1,
    bins: 6,
    norm: "L2"
  },
  svm: {
    numpasses: 5,
    C: 0.001,
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
  var stats = crossValidate(data, params.svm);
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


function testPartition(trainSet, testSet, params) {
  var SVM = new svm.SVM();
  var inputs = new Array(trainSet.length);
  var labels = new Int8Array(trainSet.length);

  for (var i = 0; i < trainSet.length; i++) {
    inputs[i] = trainSet[i].input;
    labels[i] = trainSet[i].output[0] || -1;
  }

  var beginTrain = Date.now();

  var trainingStats = SVM.train(inputs, labels, params);

  var beginTest = Date.now();

  var truePos = 0, trueNeg = 0, falsePos = 0, falseNeg = 0;

  for (var i = 0; i < testSet.length; i++) {
    var output = testSet[i].output[0];
        input = testSet[i].input;
    var result = SVM.predict([input])[0];

    if (result == 1 && output == 1) {
      truePos++;
    }
    else if (result == -1 && output == 0) {
      trueNeg++;
    }
    else if (result == 1 && output == 0) {
      falsePos++;
    }
    else if (result == -1 && output == 1) {
      falseNeg++;
    }
  }

  var endTest = Date.now();

  var stats = {
    trainTime : beginTest - beginTrain,
    trainTimePerIter: (beginTest - beginTrain) / trainingStats.iters,
    testTime : endTest - beginTest,
    iterations: trainingStats.iters,
    falsePos: falsePos,
    truePos: truePos,
    falseNeg: falseNeg,
    trueNeg: trueNeg,
    total: testSet.length
  };

  return stats;
}

function crossValidate(data, params) {
  var k = 4;
  var size = data.length / k;

  var avgs = {
    trainTime : 0,
    testTime : 0,
    iterations: 0,
    trainTimePerIter: 0
  };

  var stats = {
    truePos: 0,
    trueNeg: 0,
    falsePos: 0,
    falseNeg: 0,
    total: 0
  };

  var results = _.range(k).map(function(i) {
    var dclone = _(data).clone();
    var testSet = dclone.splice(i * size, size);
    var trainSet = dclone;

    var result = testPartition(trainSet, testSet, params);

    _(avgs).each(function(sum, stat) {
      avgs[stat] = sum + result[stat];
    });

    _(stats).each(function(sum, stat) {
      stats[stat] = sum + result[stat];
    })

    return result;
  });

  _(avgs).each(function(sum, i) {
    avgs[i] = sum / k;
  });

  stats.precision = stats.truePos / (stats.truePos + stats.falsePos);
  stats.recall = stats.truePos / (stats.truePos + stats.falseNeg);
  stats.accuracy = (stats.trueNeg + stats.truePos) / stats.total;

  stats.testSize = size;
  stats.trainSize = data.length - size;

  return {
    avgs: avgs,
    stats: stats,
    sets: results
  };
}
