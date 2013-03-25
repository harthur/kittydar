var fs = require("fs"),
    path = require("path"),
    nomnom = require("nomnom"),
    svm = require("svm"),
    params = require("./params"),
    utils = require("../../utils"),
    collect = require("../collect");

var opts = nomnom.options({
  pos: {
    abbr: 'p',
    list: true,
    required: true,
    help: "Directory of positive test images"
  },
  neg: {
    abbr: 'n',
    list: true,
    required: true,
    help: "Directory of negative test images"
  },
  jsonFile: {
    default: __dirname + "/svm.json",
    help: "SVM JSON file"
  },
  sample: {
    flag: true,
    help: "sub-sample the negative images"
  }
}).colors().parse();

testSVM();


function testSVM() {
  var json = require(opts.jsonFile)

  var SVM = new svm.SVM();
  SVM.fromJSON(json);

  var data = collect.collectData(opts.pos, opts.neg, opts.sample ? 1 : 0,
                                 undefined, undefined, params);

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
