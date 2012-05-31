var hog = require("hog-descriptor"),
    utils = require("./utils");

var defaultParams = require("./hog-params.json");

var size = 48;

exports.extractFeatures = function(canvas, params) {
  canvas = utils.resizeCanvas(canvas, size, size);

  var descriptor = hog.extractHOG(canvas, params || defaultParams);

  return descriptor;
}
