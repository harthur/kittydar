$(document).ready(function() {
  var viewer = $("#viewer");

  viewer.on('dragover', function(e) {
    e.stopPropagation();
    e.preventDefault();

    viewer.addClass('dragover');
    return false;
  })

  viewer.on('dragleave', function(e) {
    e.stopPropagation();
    e.preventDefault();

    viewer.removeClass('dragover');
    return false;
  });

  viewer.on('drop', function(e) {
    // prevent browser from opening file
    e.stopPropagation();
    e.preventDefault();
    viewer.removeClass('dragover');

    var files = e.originalEvent.dataTransfer.files;
    handleFiles(files);
    return false;
  });
});

function handleFiles(files) {
  var file = files[0];
  var imageType = /image.*/;

  if (!file.type.match(imageType)) {
    return;
  }

  var img = new Image();

  var reader = new FileReader();
  reader.onload = function(e) {
    img.onload = function() {
      drawToCanvas(img);
      detector.abortCurrent();
      detector.detectCats();
    }
    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
}

function drawToCanvas(img) {
  var width = img.width;
  var height = img.height;

  var max = Math.max(width, height)
  var scale = Math.min(max, 420) / max;

  width *= scale;
  height *= scale;

  $("#viewer").width(width).height(height);

  var anno = $("#annotations").get(0);
  anno.width = width
  anno.height = height;

  var canvas = $("#preview").get(0);
  canvas.width = width;
  canvas.height = height;

  // draw image to preview canvas
  var context = canvas.getContext("2d");
  context.drawImage(img, 0, 0, img.width, img.height,
                    0, 0, width, height);
}

var detector = {
  abortCurrent: function() {
    if (this.worker) {
      this.worker.terminate();
    }
  },

  detectCats: function() {
    var canvas = $("#preview").get(0);

    if (window.Worker) {
      var worker = new Worker("detection-worker.js");
      worker.onmessage = this.onMessage;
      worker.onerror = this.onError;

      var resizes = kittydar.getAllSizes(canvas);
      worker.postMessage(resizes);

      this.worker = worker;
    }
    else {
      var rects = kittydar.detectCats(canvas, network);
      this.paintRects(rects);
    }
  },

  paintRects : function(rects) {
    var canvas = $("#annotations").get(0);
    var ctx = canvas.getContext("2d");

    ctx.lineWidth = 2;
    ctx.strokeStyle = "red";

    for (var i = 0; i < rects.length; i++) {
      var rect = rects[i];
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
  },

  onMessage : function(event) {
    var data = event.data;
    if (data.type == 'progress') {
      detector.showProgress(data);
    }
    else if (data.type == 'result') {
      detector.paintRects(data.cats);
    }
  },

  onError : function(event) {
    console.log("Error from detection Worker:", event.message)
  },

  showProgress : function(progress) {
    console.log(progress.scale);
    /*
      var completed = progress.iterations / trainer.iterations * 100;
      $("#progress-completed").css("width", completed + "%");
    */
  }
}