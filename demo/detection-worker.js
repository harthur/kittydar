importScripts(
  "brain-0.6.0.js",
  "hog-0.4.0.js",
  "network.js",
  "kittydar-browser.js"
);

onmessage = function(event) {
  var resizes = event.data;
  var minWindow = 48;
  var cats = [];

  var net = new brain.NeuralNetwork().fromJSON(network)

  kittydar.setOptions({ network: net });

  resizes.forEach(function(resize) {
    var detected = kittydar.detectAtFixed(resize.imagedata, resize.scale);
    cats = cats.concat(detected);

    postProgress(resize);
  });

  postMessage({type: 'result', cats: cats});
}

function postProgress(progress) {
  progress.type = 'progress'
  postMessage(progress);
}