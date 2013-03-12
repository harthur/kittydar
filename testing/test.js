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
var newpasses = [];
var newfails = [];

var results = [];
var count;

var time = 0;

runTest();

function runTest() {
  fs.readdir(opts.dir, function(err, files) {
    if (err) throw err;

    var images = files.filter(function(file) {
      return path.extname(file) == ".jpg";
    });

    count = images.length;

    console.log("running kittydar on " + count + " images");
    printDots();

    async.forEach(images, testImage, printResults);
  });
}

function printResults() {
  charm.cursor(true);

  console.log("\n\ntrue positives:  ", truePos.toString().green);
  console.log("false negatives: ", misses.length.toString().red);
  console.log("false positives: ", falsePos.toString().red);

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

  var avg = (time / count / 1000).toFixed(2);  // baseline 5.08s
  console.log("\naverage time per image: " + avg + "s\n");
}

function testImage(image, callback) {
  var file = opts.dir + image;

  fs.readFile(file + ".cat", "utf-8", function(err, text) {
    if (err) throw err;

    var vals = text.split(" ").map(function(val) {
      return parseInt(val)
    });

    var rect;
    if (vals.length >= 4) {
      rect = {
        x: vals[0],
        y: vals[1],
        width: vals[2],
        height: vals[3]
      };
    }

    utils.drawImgToCanvas(file, function(err, canvas) {
      // todo: detect time
      var t1 = Date.now();

      var cats = kittydar.detectCats(canvas);

      time += Date.now() - t1;

      var found = false;
      cats.forEach(function(cat) {
        var overlaps = false;
        if (rect) {
          overlaps = nms.doesOverlap(cat, rect);
        }
        if (overlaps) {
          found = true;
          truePos++;
        }
        else {
          falsePos++;
        }
      });

      if (found) {
        results.push("pass");

        if (todos.indexOf(image) >= 0) {
          newpasses.push(file);
        }
      }
      else if (rect) {
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
  charm.move(-count, 0);

  var str = "";
  for (var i = 0; i < results.length; i++) {
    if (results[i] == "pass") {
      str += "•".green.bold;
    }
    else  {
      str += "•".red.bold;
    }
  }
  var rest = count - results.length;

  for (var i = 0; i < rest; i++) {
    str += "·".grey;
  }
  charm.write(str);
}
