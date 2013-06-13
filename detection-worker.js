importScripts(
  "kittydar-0.1.6.js"
);

onmessage = function(event) {
  var resizes = event.data;

  var cats = [];
  var time = 0;
  var t1 = Date.now();
  resizes.forEach(function(resize) {
    var d1 = Date.now();
    var detected = kittydar.detectAtScale(resize.imagedata, resize.scale);
    time += Date.now() - d1;
    cats = cats.concat(detected);

    postProgress({
      size: resize.size,
      rects: detected
    });
  });

  cats = kittydar.combineOverlaps(cats, 0.25, 4);

  var totalTime = Date.now() - t1;

  postMessage({ type: 'result', cats: cats , time: time});
}

function postProgress(progress) {
  progress.type = 'progress'
  postMessage(progress);
}