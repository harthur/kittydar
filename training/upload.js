var fs = require("fs"),
    path = require("path"),
    async = require("async"),
    cradle = require("cradle"),
    Canvas = require("canvas"),
    features = require("./features");

var negsDir = __dirname + "/NEGATIVES/";
var posDir = __dirname + "/POSITIVES/";

var db = new(cradle.Connection)().database('cats-hog');

var limit = 9000;
var count = 0;

//uploadDir(posDir, 1);
uploadDir(negsDir, 0);

function uploadDir(dir, isCat) {
  var docs = [];

  fs.readdir(dir, function(err, files) {
    if (err) throw err;

    var images = files.filter(function(file) {
      return path.extname(file) == ".jpg";
    });

    images = images.slice(limit, limit + 1000);

    async.forEach(images, function(file, done) {
      file = dir + file;

      // sync for EMFILE "too many open files" error
      features.extractFeatures(file, function(fts) {
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
