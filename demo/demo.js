$(document).ready(function() {
  var viewer = $("#viewer");


  var anno = $("#annotations");

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
    img.src = e.target.result;
    drawCanvas(img);
    detectCats();
  };

  reader.readAsDataURL(file);
}

function drawCanvas(img) {
  var width = img.width;
  var height = img.height;

  var min = Math.min(width, height);
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


function detectCats() {
  var canvas = $("#annotations").get(0);
  var ctx = canvas.getContext("2d");

  ctx.lineWidth = 2;
  ctx.strokeStyle = "red";
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 2;
  ctx.shadowColor = "rgba(1, 1, 1, 1)";

  var cats = [{x: 20, y: 20, width: 30, height: 30}];  //kittydar.detectCats(canvas);

  for (var i = 0; i < cats.length; i++) {
    var cat = cats[i];
    ctx.strokeRect(cat.x, cat.y, cat.width, cat.height);
    //context.strokeRect(cat.x - 1, cat.y - 1, cat.width + 1, cat.height + 1);
  }
}
