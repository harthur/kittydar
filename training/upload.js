var fs = require("fs"),
    path = require("path"),
    async = require("async"),
    cradle = require("cradle"),
    utils = require("../utils"),
    features = require("../features");

var negsDir = __dirname + "/NEGATIVES/";
var posDir = __dirname + "/POSITIVES/";

var db = new(cradle.Connection)().database('cats-hog-c6-b9');

var count = 0;

//uploadDir(posDir, 1, 5000);
uploadDir(negsDir, 0, 5000);

function uploadDir(dir, isCat, limit) {
  var docs = [];

  fs.readdir(dir, function(err, files) {
    if (err) throw err;

    var images = files.filter(function(file) {
      return path.extname(file) == ".jpg";
    });

    images = images.slice(0, limit);

    async.forEach(images, function(file, done) {
      file = dir + file;

      utils.drawImgToCanvas(file, function(canvas) {
        var fts = features.extractFeatures(canvas);

        docs.push({
          file: file,
          input: fts,
          output: [isCat]
        });

        if (++count % 1000 == 0) {
          console.log("processed", count)
        }
        done();
      });
    },
    function() {
      db.save(docs, function(err) {
        if (err) throw err;
      });
    });
  });
}
