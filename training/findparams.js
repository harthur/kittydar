var fs = require("fs"),
    brain = require("brain"),
    path = require("path"),
    async = require("async"),
    _ = require("underscore"),
    utils = require("../utils"),
    features = require("../features");

var limit = 4000;


function getCombos() {
  var cellSizes = [4, 6];
  var bins = [6];
  var strides = [1]; //, 0.5];
  var norms = ["L2"];
  var blockSize = 2;

  var combos = [];
  cellSizes.forEach(function(cellSize) {
    strides.forEach(function(stride) {
      bins.forEach(function(bin) {
        norms.forEach(function(norm) {
          combos.push({
            cellSize: cellSize,
            blockSize: blockSize,
            blockStride: blockSize * stride,
            bins: bin,
            norm: norm
          })
        })
      })
    })
  })

  return combos;
}

var combos = [
{
  cellSize: 4,
  blockSize: 2,
  blockStride: 1,
  bins: 6,
  norm: "L2"
},
{
  cellSize: 4,
  blockSize: 2,
  blockStride: 1,
  bins: 7,
  norm: "L2"
}
];

console.log("testing", combos.length, "combinations");

testAll(combos)

function testAll(combos) {
  getCanvases(function(canvases) {
    var tests = [];

    for (var i = 0; i < combos.length; i++) {
      var params = combos[i];
      console.log("testing", i + 1, params)

      var stats = testParams(canvases, params);
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
  })
}


function getPrintout(tests) {
  var sorted =  _(tests).sortBy(function(test) {
    return test.stats.falsePos;
  });
  var lines = sorted.map(function(test) {
    return JSON.stringify(test.params) + " "
      + test.featureSize + " "
      + test.stats.precision + " "
      + test.stats.falsePos;
  });
  return lines.join("\n");
}

function testParams(canvases, params) {
  var data = canvases.map(function(canvas) {
    var fts = features.extractFeatures(canvas.canvas, params);
    return {
      input: fts,
      output: [canvas.isCat]
    };
  })

  var opts = {
    hiddenLayers: [30]
  };
  var trainOpts = {
    errorThresh: 0.006,
    log: true
  };

  var stats = brain.crossValidate(brain.NeuralNetwork, data, opts, trainOpts);
  stats.featureSize = data[0].input.length;
  return stats;
}


function getCanvases(callback) {
  var posDir = __dirname + "/POSITIVES/";

  fs.readdir(posDir, function(err, files) {
    if (err) throw err;

    getDir(posDir, files, 1, function(posData) {
      var negsDir = __dirname + "/NEGATIVES/";
      fs.readdir(negsDir, function(err, files) {
        if (err) throw err;

        getDir(negsDir, files, 0, function(negData) {
          var data = posData.concat(negData);

          callback(data);
        })
      })
    })
  });
}

function getDir(dir, files, isCat, callback) {
  var images = files.filter(function(file) {
    return path.extname(file) == ".jpg";
  });
  images = images.slice(0, limit);

  var data = [];

  async.map(images, function(file, done) {
    file = dir + file;

    utils.drawImgToCanvas(file, function(err, canvas) {
      done(null, {canvas: canvas, file: file, isCat: isCat});
    });
  },
  function(err, canvases) {
    callback(canvases);
  });
}
