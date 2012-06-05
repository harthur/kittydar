var hog = require("hog-descriptor"),
    hoog = require("hoog"),
    utils = require("./utils");

var defaultParams = require("./hog-params.json");

var size = 48;

exports.extractFeatures = function(canvas, params) {
  canvas = utils.resizeCanvas(canvas, size, size);

  var descriptor = hog.extractHOG(canvas, params || defaultParams);
/*
  var haars = hoog.extractHOOG(canvas, 6, [{
    rect1: {
      channel: 0
    },
    rect2: {
      channel: 0
    }
  }]);
*/
  return descriptor;
}
