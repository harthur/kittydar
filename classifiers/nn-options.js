/*
  Running kittydar with these options will use the neural network backend:

  var options = require("./nn-options");
  kittydar.detectCats(canvas, options);
 */
var brain = require("brain");

var network = require("./network.js");
var net = new brain.NeuralNetwork().fromJSON(network);

module.exports = {
  shiftBy: 6,        // px to slide window by
  minOverlaps: 2,    // minumum overlapping rects to classify as a head
  HOGparams: {       // parameters for HOG descriptor
    cellSize: 6,     // must divide evenly into shiftBy
    blockSize: 2,
    blockStride: 1,
    bins: 6,
    norm: "L2"
  },
  classify: function(features) {
    var output = net.runInput(features)[0];
    return {
      isCat: output > 0.9998,
      value: output
    };
  }
}
