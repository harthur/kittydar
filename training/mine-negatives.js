var fs = require("fs"),
    path = require("path"),
    brain = require("brain"),
    nomnom = require("nomnom"),
    features = require("../features"),
    utils = require("../utils")
    collect = require("./collect");

var opts = nomnom.options({
  negDir: {
    position: 0,
    default: __dirname + "/collection/NEGATIVES/",
    required: true,
    help: "Directory of negatives"
  },
  minedDir: {
    position: 1,
    default: __dirname + "/collection/MINED_NEGATIVES/",
    required: true,
    help: "Directory to put mined hard negatives in"
  },
  network: {
    default: __dirname + "/network.json",
    help: "Neural network JSON file"
  },
  samples: {
    default: 1,
    help: "How many times to sub-sample full negative image"
  },
  limit: {
    default: undefined,
    help: "Max number of negative images to process from directory"
  },
  threshold: {
    default: 0.9,
    help: "How wrong the classification is, from 0.5+ to 1.0"
  }
}).colors().parse();

mineNegatives();

function mineNegatives() {
  var samples = collect.getDir(opts.negDir, false, opts.samples, opts.limit);

  console.log("mining negatives from " + samples.length);

  var trained = require(opts.network);
  var network = new brain.NeuralNetwork().fromJSON(trained);

  var falsePositives = 0;
  for (var i = 0; i < samples.length; i++) {
    var sample = samples[i];
    var fts = features.extractFeatures(sample.canvas);
    var result = network.run(fts);

    if (result >= opts.threshold) {
      console.log(result);
      falsePositives++;

      var rand = Math.floor(Math.random() * 1000);
      var file = opts.minedDir + "/" + rand + "_" + path.basename(sample.file);

      utils.writeCanvasToFile(sample.canvas, file, function(err) {
        if (err) throw err;
      })
    }
  }
  console.log(falsePositives + " false positives found");
}
