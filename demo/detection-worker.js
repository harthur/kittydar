importScripts(
  "bundle.js"
);

onmessage = function(event) {
  var resizes = event.data;
  var minWindow = 48;

  var cats = [];
  resizes.forEach(function(resize) {
    var detected = kittydar.detectAtFixed(resize.imagedata, resize.scale);
    cats = cats.concat(detected);

    postProgress({
      size: resize.size,
      rects: detected
    });
  });

  cats = kittydar.combineOverlaps(cats);

  postMessage({type: 'result', cats: cats});
}

function postProgress(progress) {
  progress.type = 'progress'
  postMessage(progress);
}