var hog = require("hog-descriptor"),
    utils = require("./utils");

var resize = 48;

exports.extractFeatures = function(file, callback) {
  utils.drawImgToCanvas(file, resize, function(canvas) {
    var descriptor = hog.extractHOG(canvas, {
      cellSize: 6,
      blockSize: 2,
      bins: 6,
      norm: "L2"
    });
    callback(descriptor);
  });
}
