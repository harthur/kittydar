var fs = require("fs"),
    path = require("path"),
    svm = require("svm"),
    nomnom = require("nomnom"),
    params = require("./params"),
    features = require("../features"),
    utils = require("../../utils"),
    collect = require("../collect");

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
  jsonFile: {
    default: __dirname + "/svm.json",
    help: "Neural network JSON file"
  },
  samples: {
    default: 1,
    help: "How many times to sub-sample full negative image"
  },
  limit: {
    default: undefined,
    help: "Max number of negative images to process from directory"
  }
}).colors().parse();

var obj = require(opts.jsonFile);

var SVM = new svm.SVM();
SVM.fromJSON(obj);

mineNegatives();

function mineNegatives() {
  var files = fs.readdirSync(opts.negDir);

  var images = files.filter(function(file) {
    return (path.extname(file) == ".png"
         || path.extname(file) == ".jpg");
  });
  images = images.slice(0, opts.limit);

  console.time("mined in");
  console.log("mining negatives from " + images.length);

  var falsePositives = 0;
  for (var i = 0; i < images.length; i++) {
    var image = images[i];
    var file = opts.negDir + "/" + image;

    try {
      var canvas = utils.drawImgToCanvasSync(file);
    }
    catch (e) {
      console.log(e, file);
      fs.unlinkSync(file);
      console.log("deleted", file);
    }
    var samples = collect.extractSamples(canvas, opts.samples);

    for (var j = 0; j < samples.length; j++) {
      var fp = testSample(image, samples[j]);
      falsePositives += fp ? 1 : 0;
    }
  }
  console.log(falsePositives + " hard negatives mined");
  console.timeEnd("mined in");
}

function testSample(file, canvas) {
  var fts = features.extractFeatures(canvas, params.HOG);

  var result = SVM.predict([fts])[0];

  if (result == 1) {
    console.log("false positive", file);
    // write this image to the directory of mined negative images
    var rand = Math.floor(Math.random() * 1000);
    var file = opts.minedDir + "/" + rand + "_" + path.basename(file);
    utils.writeCanvasToFileSync(canvas, file);
    return true;
  }
  return false;
}
