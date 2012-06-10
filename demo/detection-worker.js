importScripts(
  "bundle-6.js"
);

kittydar.setOptions({
  threshold: 0.999,
  scaleStep: 6,
  shiftBy: 6
})

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