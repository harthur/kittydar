var hog = require("hog-descriptor"),
    utils = require("./utils");

var defaultParams = {
  "cellSize": 6,
  "blockSize": 2,
  "blockStride": 1,
  "bins": 6,
  "norm": "L2"
}

var size = 48;

exports.extractFeatures = function(canvas, params) {
  canvas = utils.resizeCanvas(canvas, size, size);

  var descriptor = hog.extractHOG(canvas, params || defaultParams);
  return descriptor;
}
