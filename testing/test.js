var brain = require("brain"),
    fs = require("fs"),
    path = require("path"),
    async = require("async"),
    utils = require("../utils"),
    kittydar = require("../kittydar");

var dir = __dirname + "/TEST/";

runTest();

function runTest() {
  var truePos = 0;
  var falsePos = 0;
  var misses = 0;
  var total = 0;

  fs.readdir(dir, function(err, files) {
    if (err) throw err;

    var images = files.filter(function(file) {
      return path.extname(file) == ".jpg";
    })

    images = images.slice(0, 1);

    async.forEach(images, function(file, done) {
      file = dir + file;

      fs.readFile(file + ".rect", "utf-8", function(err, text) {
        if (err) throw err;

        var vals = text.split(" ");
        var rect = {
          x: vals[0],
          y: vals[1],
          width: vals[2],
          height: vals[3]
        };

        utils.drawImgToCanvas(file, function(canvas) {
          console.time("detecting")
          var info = kittydar.detectCats(canvas);
          var cats = info.cats;
          console.timeEnd("detecting")
          total += info.total;

          var missed = true;

          console.log("testing", file);

          cats.forEach(function(cat) {
            if (doesOverlap(cat, rect)) {
              missed = false;
              truePos++;
            }
            else {
              falsePos++;
            }
          });

          if (missed) {
            misses++;
          }

          done();
        });
      })
    },
    function() {
      console.log("misses", misses)
      console.log("truePos", truePos, "falsePos", falsePos);
      console.log("total", total);

      var precision = truePos / (truePos + falsePos);
      console.log("precision", precision);

      var fpr = falsePos / (total - truePos);
    });
  });
}

function doesOverlap(cat, rect) {
  var overlapW, overlapH;

  if (cat.x > rect.x) {
    overlapW = (rect.x + rect.width) - cat.x;
  }
  else {
    overlapW = (cat.x + cat.width) - rect.x;
  }

  if (cat.y > rect.y) {
    overlapH = (rect.y + rect.height) - cat.y;
  }
  else {
    overlapH = (cat.y + cat.height) - rect.y;
  }

  if (overlapW > 0 && overlapH > 0) {
    return (overlapH * overlapW) > (cat.width * cat.height * 0.5);
  }
  return false;
}
