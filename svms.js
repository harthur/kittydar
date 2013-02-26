/* To use a trained SVM as a classifier instead of the neural network:
   require this file and run kittydar with:

  var classifySVM = require("./svms");

  kittydar.detectCats(canvas, {
    classify: classifySVM
  });

*/

var svm = require("svm");

var state = require("./svm.json");
var SVM = new svm.SVM();
SVM.fromJSON(state);

module.exports = function classify(features) {
  var label = SVM.predict([features])[0];
  return {
    isCat: label == 1,
    value: 1
  };
}
