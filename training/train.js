var cradle = require("cradle"),
    brain = require("brain"),
    fs = require("fs");

var db = new(cradle.Connection)().database('cats-hog');

db.all({include_docs: true}, function(err, res) {
  if (err) {
    console.log(err);
  }
  else {
    var posData = [];
    var negData = [];

    res.rows.forEach(function(row) {
      var doc = row.doc;
      if (doc.output[0]) {
        posData.push(doc);
      }
      else {
        negData.push(doc);
      }
    });

    var posSize = 10000;
    var negSize = 10000;
    var data = posData.slice(0, posSize).concat(negData.slice(0, negSize));

    console.log("training with", data.length);
    console.log(posSize, "positives", negSize, "negatives")

    var opts = {
      hiddenLayers: [40]
    };
    var trainOpts = {
      errorThresh: 0.005,
      log: true
    };
    var stats = brain.crossValidate(brain.NeuralNetwork, data, opts, trainOpts);
    console.log("averages:", stats.avgs);
    console.log("parameters:", stats.parameters);

    fs.writeFile('misclasses.json', JSON.stringify(stats.misclasses, 4), function (err) {
      if (err) throw err;
      console.log('saved misclasses');
    });


    var minError = 1;
    var network;

    stats.sets.forEach(function(set) {
      if (set.stats.error < minError) {
        minError = set.stats.error;
        network = set.network;
      }
    })

    var json = JSON.stringify(network, 4)
    fs.writeFile('cv-network.json', json, function (err) {
      if (err) throw err;
      console.log('saved network to cv-network.json');
    });
  }
});
