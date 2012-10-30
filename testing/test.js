var fs = require("fs"),
    path = require("path"),
    util = require("util"),
    async = require("async"),
    nomnom = require("nomnom"),
    Canvas = require("canvas"),
    color = require("colors"),
    charm = require("charm")(),
    utils = require("../utils"),
    nms = require("../nms"),
    kittydar = require("../kittydar");

charm.pipe(process.stdout);

var opts = nomnom.options({
  dir: {
    default: __dirname + "/TEST/",
    help: "directory of images to test"
  }
}).parse();

var truePos = 0;
var falsePos = 0;
var misses = [];
var finds = [];
var results = [];
var total;

var totalTime;

runTest();

function runTest() {
  fs.readdir(opts.dir, function(err, files) {
    if (err) throw err;

    var images = files.filter(function(file) {
      return path.extname(file) == ".jpg";
    })

    images = images.slice(0, 4);

    total = images.length;

    printDots();
    async.forEach(images, testImage, printResults);
  });
}

function printResults() {
  console.log("\n\ntrue positives:  ", truePos);
  console.log("false negatives: ", misses.length);
  console.log("false positives: ", falsePos);

  console.log("\nfound:\n", finds);
  console.log("\nmisses:\n", misses);
}

function testImage(file, callback) {
  file = opts.dir + file;

  fs.readFile(file + ".cat", "utf-8", function(err, text) {
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
      // todo: detect time
      var cats = kittydar.detectCats(canvas);

      var found = false;
      cats.forEach(function(cat) {
        var overlaps = doesOverlap(cat, rect);
        if (overlaps) {
          found = true;
          truePos++;
        }
        else {
          falsePos++;
        }
      });

      if (found) {
        finds.push(file);
        results.push("pass")
      }
      else {
        misses.push(file);
        results.push("fail");
      }
      printDots();

      callback();
    });
  })
}

function printDots() {
  charm.erase("start");
  charm.move(-total, 0);

  var str = "";
  for (var i = 0; i < results.length; i++) {
    if (results[i] == "pass") {
      str += "•".green.bold;
    }
    else  {
      str += "•".red.bold;
    }
  }
  var rest = total - results.length;

  for (var i = 0; i < rest; i++) {
    str += "·".grey;
  }
  charm.write(str);
  charm.down(1);
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
