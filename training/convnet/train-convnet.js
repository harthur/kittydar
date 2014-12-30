var fs = require("fs"),
    convnet = require("convnetjs"),
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
    default: __dirname + "/convnet.json",
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
  getRawPixels: true,
  greyscalePixels: true
};

trainNetwork(params)

function trainNetwork(params) {
  console.log("extracting features from images");
  var data = collect.collectData(opts.pos, opts.neg, 0,
                                 opts.posLimit, opts.negLimit, params);

  console.log("training on", data.length);
  console.log("feature size:", data[0].input.w.length);

  var network = createNetwork();

  console.log("training network");

  var stats = trainWithData(network, data);

  console.log("training stats:", stats);

  var json = JSON.stringify(network.toJSON(), 4)

  fs.writeFile(opts.outfile, json, function (err) {
    if (err) throw err;
    console.log('saved network to', opts.outfile);
  });

  if (opts.testPos && opts.testNeg) {
    testNetwork(network);
  }
}

function trainWithData(network, data) {
  // parameters taken from convnetjs example for beginners
  var trainer = new convnet.Trainer(network, {method: 'adadelta', l2_decay: 0.001,
                                    batch_size: 10});
  var stats;
  for (var i = 0; i < data.length; i++) {
    var vol = data[i].input;
    var classification = data[i].output[0];

    stats = trainer.train(vol, classification);
  }
  return stats;
}

function createNetwork() {
  var layers = [];
  // out_depth is 1 for greyscale, or 4 for rgba
  layers.push({type:'input', out_sx:32, out_sy:32, out_depth:1}); // declare size of input

  // the layer will perform convolution with 16 kernels, each of size 5x5.
  // the input will be padded with 2 pixels on all sides to make the output Vol of the same size
  // output Vol will thus be 32x32x16 at this point
  layers.push({type:'conv', sx:5, filters:16, stride:1, pad:2, activation:'relu'});

  // pooling layer, output Vol is of size 16x16x16 here
  layers.push({type:'pool', sx:2, stride:2});

  // convolutional layer, output Vol is of size 16x16x20 here
  layers.push({type:'conv', sx:5, filters:20, stride:1, pad:2, activation:'relu'});

  // pooling layer, output Vol is of size 8x8x20 here
  layers.push({type:'pool', sx:2, stride:2});

  // convolutional layer, output Vol is of size 8x8x20 here
  layers.push({type:'conv', sx:5, filters:20, stride:1, pad:2, activation:'relu'});

  // pooling layer, output Vol is of size 4x4x20 here
  layers.push({type:'pool', sx:2, stride:2});

  // classification layer, output Vol is of size 1x1x10 here
  // there are two classes, "cat" and "non-cat"
  layers.push({type:'softmax', num_classes: 2});

  net = new convnet.Net();
  net.makeLayers(layers);

  return net;
}

function testNetwork(network) {
  console.log("extracting features from test images");
  var data = collect.collectData(opts.testPos, opts.testNeg, opts.sample ? 1 : 0,
                                 undefined, undefined, params);
  console.log("testing on", data.length);

  console.time("TEST");

  var stats = getTestStats(network, data);

  console.timeEnd("TEST");

  console.log("precision: " + stats.precision)
  console.log("recall:    " + stats.recall)
  console.log("accuracy:  " + stats.accuracy)

  console.log(stats.truePos + " true positives");
  console.log(stats.trueNeg + " true negatives");
  console.log(stats.falsePos + " false positives");
  console.log(stats.falseNeg + " false negatives");
  console.log(stats.total + " total");
}

function getTestStats(network, data) {
  var falsePos = 0,
      falseNeg = 0,
      truePos = 0,
      trueNeg = 0;

  var misclasses = [];

  // run each pattern through the trained network and collect
  // error and misclassification statistics
  var sum = 0;
  for (var i = 0; i < data.length; i++) {
    var output = network.forward(data[i].input).w; // pass forward through network
    var actual = output[0] > output[1] ? 0 : 1;
    var expected = data[i].output;

    if (actual != expected) {
      misclasses.push(data[i]);
    }

    if (actual == 0 && expected == 0) {
      trueNeg++;
    }
    else if (actual == 1 && expected == 1) {
      truePos++;
    }
    else if (actual == 0 && expected == 1) {
      falseNeg++;
    }
    else if (actual == 1 && expected == 0) {
      falsePos++;
    }
  }

  var stats = {
    misclasses: misclasses,
    trueNeg: trueNeg,
    truePos: truePos,
    falseNeg: falseNeg,
    falsePos: falsePos,
    total: data.length,
    precision: truePos / (truePos + falsePos),
    recall: truePos / (truePos + falseNeg),
    accuracy: (trueNeg + truePos) / data.length
  }
  return stats;
}
