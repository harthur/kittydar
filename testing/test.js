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
    kittydar = require("../kittydar"),
    todos = require("./todos");

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
var newpasses = [];
var newfails = [];
var results = [];
var total;

var totalTime;

runTest();

function runTest() {
  fs.readdir(opts.dir, function(err, files) {
    if (err) throw err;

    var images = files.filter(function(file) {
      return path.extname(file) == ".jpg";
    });

    total = images.length;

    console.log("running kittydar on " + total + " images");
    printDots();

    async.forEach(images, testImage, printResults);
  });
}

function printResults() {
  charm.cursor(true);

  console.log("\n\ntrue positives:  ", truePos);
  console.log("false negatives: ", misses.length);
  console.log("false positives: ", falsePos);

  if (newpasses.length) {
    console.log("\nnew passes!".green);
    for (var i = 0; i < newpasses.length; i++) {
      console.log(newpasses[i]);
    }
    console.log("\n");
  }

  if (newfails.length) {
    console.log("\nnew failures )=".red);
    for (var i = 0; i < newfails.length; i++) {
      console.log(newfails[i]);
    }
    console.log("\n");
  }
}

function testImage(image, callback) {
  var file = opts.dir + image;

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
        results.push("pass");

        if (todos.indexOf(image) >= 0) {
          newpasses.push(file);
        }
      }
      else {
        misses.push(file);
        results.push("fail");

        if (todos.indexOf(image) == -1) {
          newfails.push(file);
        }
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

  // hide the cursor when printing the dots
  charm.cursor(false);
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
