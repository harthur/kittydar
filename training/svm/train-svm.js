var fs = require("fs"),
    path = require("path"),
    nomnom = require("nomnom"),
    svm = require("svm"),
    utils = require("../../utils"),
    features = require("../../features"),
    collect = require("../collect");

var opts = nomnom.options({
  posDir: {
    position: 0,
    default: __dirname + "/collection/POSITIVES/",
    help: "Directory of cat head images"
  },
  negDir: {
    position: 1,
    default: __dirname + "/collection/NEGATIVES/",
    help: "Directory of negative images"
  },
  testPos: {
    position: 2,
    default: __dirname + "/collection/POSITIVES_TEST",
    help: "Directory of test positive images"
  },
  testNeg: {
    position: 3,
    default: __dirname + "/collection/NEGATIVES_TEST",
    help: "Directory of test negative images"
  },
  outfile: {
    default: __dirname + "/network.json",
    help: "file to save network JSON to"
  },
  sample: {
    flag: true,
    help: "whether to sub-sample the negative images"
  },
  limit: {
    default: 10000,
    help: "maximum number of images to use from each directory"
  }
}).colors().parse();

var params = {
  HOG: {
    cellSize: 6,
    blockSize: 2,
    blockStride: 1,
    bins: 6,
    norm: "L2"
  },
  svm: {
    numpasses: 3,
    kernel: 'rbf',
    rbfsigma: 2,
    C: 5
  }
};

trainSVM(params)

function trainSVM(params) {
  var samples = opts.sample ? 1 : 0;
  var data = collect.collectData(opts.posDir, opts.negDir, samples,
                                 opts.limit, params);

  var inputs = [];
  var labels = [];

  for (var i = 0; i < data.length; i++) {
    inputs[i] = data[i].input;
    labels[i] = data[i].output[0] || -1;
  }

  console.log("training on", data.length);

  var SVM = new svm.SVM();

  console.time("TRAIN");
  var stats = SVM.train(inputs, labels, params.svm);
  console.timeEnd("TRAIN");

  console.log("stats:", stats);
  console.log("parameters:", params);

  var obj = SVM.toJSON();

  var json = JSON.stringify(SVM.toJSON(), 4);

  console.log("LEN: ", obj.data.length);

  fs.writeFile(opts.outfile, json, function (err) {
    if (err) throw err;
    console.log('saved svm JSON to', opts.outfile);
  });

  testSVM(SVM);
}

function testSVM(SVM) {
  var data = collect.collectData(opts.testPos, opts.testNeg, opts.sample ? 1 : 0);

  console.time("TEST")
  var truePos = 0, trueNeg = 0, falsePos = 0, falseNeg = 0;
  for (var i = 0; i < data.length; i++) {
    var output = data[i].output[0];
        input = data[i].input;
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
  console.timeEnd("TEST");

  console.log("precision: " + truePos / (truePos + falsePos))
  console.log("recall:    " + truePos / (truePos + falseNeg))

  console.log(truePos + " true positives");
  console.log(trueNeg + " true negatives");
  console.log(falsePos + " false positives");
  console.log(falseNeg + " false negatives");
  console.log(data.length + " total");
}
