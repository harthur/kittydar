var brain = require("brain"),
    fs = require("fs"),
    path = require("path"),
    async = require("async"),
    utils = require("../utils"),
    Canvas = require("canvas"),
    kittydar = require("../kittydar");

var dir = __dirname + "/TEST/";

runTest();

function runTest() {
  var truePos = 0;
  var falsePos = 0;
  var misses = [];
  var total = 0;

  fs.readdir(dir, function(err, files) {
    if (err) throw err;

    var images = files.filter(function(file) {
      return path.extname(file) == ".jpg";
    })

    async.forEach(images, function(file, done) {
      file = dir + file;

      fs.readFile(file + ".rect", "utf-8", function(err, text) {
        if (err) throw err;

        var vals = text.split(" ").map(function(val) {
          return parseInt(val)
        })

        var rect = {
          x: vals[0],
          y: vals[1],
          width: vals[2],
          height: vals[3]
        };

        utils.drawImgToCanvas(file, function(err, canvas) {
          console.time("detecting");

          var options = {
            scaleStep: 6,
            overlapThresh: 0.3,
            minOverlaps: 1,
            shiftBy: 8
          };

          var cats = kittydar.detectCats(canvas, options);
          console.timeEnd("detecting", file)

          var missed = true;

          cats.forEach(function(cat) {
            var overlaps = doesOverlap(cat, rect);

            if (overlaps) {
              missed = false;
              truePos++;
            }
            else {
              falsePos++;
            }
            saveCrop(canvas, cat, overlaps);
          });

          if (missed) {
            misses.push(file);
          }

          done();
        });
      })
    },
    function() {
      console.log("\nmisses", misses.length, "truePos", truePos, "falsePos", falsePos);

      console.log("\nmisses", misses)

      var precision = truePos / (truePos + falsePos);
      console.log("precision", precision);

      var fpr = falsePos / (total - truePos);
    });
  });
}

function saveCrop(canvas, cat, isTrue) {
  var cropCanvas = new Canvas(cat.width, cat.height);
  var ctx = cropCanvas.getContext('2d');
  ctx.patternQuality = "best";

  ctx.drawImage(canvas, cat.x, cat.y, cat.width, cat.height,
                0, 0, cat.width, cat.height);

  var dir = __dirname + "/CROPS/" + (isTrue ? "/TRUE/" : "/FALSE/");
  var file = dir + cat.x + "_" + cat.y + "_" + cat.width
             + "_" + cat.prob.toFixed(2) + ".jpg"
  utils.writeCanvasToFile(cropCanvas, file, function(err) {
    if (err) console.log(err);
  });
}

function doesOverlap(cat, rect) {
  var overlapW, overlapH;

  if (cat.x > rect.x) {
    overlapW = Math.min((rect.x + rect.width) - cat.x, cat.width);
  }
  else {
    overlapW = Math.min((cat.x + cat.width) - rect.x, rect.width);
  }

  if (cat.y > rect.y) {
    overlapH = Math.min((rect.y + rect.height) - cat.y, cat.height);
  }
  else {
    overlapH = Math.min((cat.y + cat.height) - rect.y, rect.height);
  }

  if (overlapW <= 0 || overlapH <= 0) {
    return false;
  }
  var intersect = overlapW * overlapH;
  var union = (cat.width * cat.height) + (rect.width * rect.height) - (intersect * 2);

  if (intersect / union > 0.5) {
    return true;
  }
  return false;
}
