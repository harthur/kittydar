/*
  Running kittydar with these options will use the neural network backend:

  var options = require("./svm-options");
  kittydar.detectCats(canvas, options);
 */
var svm = require("svm");

var state = require("./mixed-svm-1000.json");
var SVM = new svm.SVM();
SVM.fromJSON(state);

module.exports = {
  shiftBy: 4,        // px to slide window by
  minOverlaps: 2,    // minumum overlapping rects to classify as a head
  HOGparams: {       // parameters for HOG descriptor
    cellSize: 4,     // must divide evenly into shiftBy
    blockSize: 2,
    blockStride: 1,
    bins: 6,
    norm: "L2"
  },
  classify: function(features) {
    var label = SVM.predict([features])[0];
    return {
      isCat: label == 1,
      value: 1
    };
  }
}
