var fs = require("fs"),
    path = require("path"),
    async = require("async"),
    cropper = require("./cropper");

var dir = __dirname + "/CATS_ORIG/CAT_06/";
var outdir = __dirname + "/POS_RAW/";

var count = 0;
var start = 8622;

fs.readdir(dir, function(err, files) {
  if (err) throw err;

  console.log("file count", files.length / 2);

  var images = files.filter(function(file) {
    return path.extname(file) == ".jpg";
  })

  async.forEachSeries(images, function(file, done) {
    count++;
    var outfile = outdir + (start + count) + ".jpg";

    cropper.makeCatFaceImg(dir + file, outfile, function() {
      console.log("saved cat face to:", outfile);
      setTimeout(done, 100);
    });
  });
})

