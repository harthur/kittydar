importScripts(
  "kittydar-0.1.1.js"
);

onmessage = function(event) {
  var resizes = event.data;

  var cats = [];
  resizes.forEach(function(resize) {
    var detected = kittydar.detectAtScale(resize.imagedata, resize.scale);
    cats = cats.concat(detected);

    postProgress({
      size: resize.size,
      rects: detected
    });
  });

  cats = kittydar.combineOverlaps(cats, 0.25, 2);

  postMessage({ type: 'result', cats: cats });
}

function postProgress(progress) {
  progress.type = 'progress'
  postMessage(progress);
}