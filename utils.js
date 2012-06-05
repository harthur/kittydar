var url = require("url"),
    fs = require("fs"),
    http = require("http"),
    Canvas = require("canvas");

exports.getCatData = function(file, callback) {
  fs.readFile(file, "utf-8", function(err, data) {
    if (err) throw err;

    var vals = data.split(" ").map(parseFloat);
    var length = vals[0];
    if (length != 9) {
      console.log("different number of points:", length);
    }

    var features = ["leye", "reye", "mouth", "lear1", "lear2",
                    "lear3", "rear1", "rear2", "rear3"];
    var points = {};
    for (var i = 0; i < length; i ++) {
      points[features[i]] = {
        x: vals[i * 2 + 1],
        y: vals[i * 2 + 2]
      }
    }
    callback(points);
  })
}

exports.dataToCanvas = function(imagedata) {
  img = new Canvas.Image();
  img.src = new Buffer(imagedata, 'binary');

  var canvas = new Canvas(img.width, img.height);
  var ctx = canvas.getContext('2d');
  ctx.patternQuality = "best";

  ctx.drawImage(img, 0, 0, img.width, img.height,
    0, 0, img.width, img.height);
  return canvas;
}

exports.drawImgToCanvas = function(file, callback) {
  fs.readFile(file, function(err, data) {
    if (err) {
      // console.log(file, err)
      return callback(err);
    }
    try {
      var canvas = exports.dataToCanvas(data);
    } catch(err) {
      // console.log(file, err)
      return callback(err);
    }
    callback(null, canvas);
  });
}

exports.drawImgToCanvasSync = function(file) {
  var data = fs.readFileSync(file)
  var canvas = exports.dataToCanvas(data);
  return canvas;
}

exports.writeCanvasToFile = function(canvas, file, callback) {
  var out = fs.createWriteStream(file)
  var stream = canvas.createJPEGStream();

  stream.on('data', function(chunk) {
    out.write(chunk);
  });

  stream.on('end', function() {
    callback();
  });
}

exports.saveImgToFile = function(file, imagedata) {
  fs.writeFile(file, imagedata, 'binary', function(err) {
    if (err) throw err;
    console.log("File " + file + " saved");
  })
}

exports.getImg = function(uri, callback) {
  var options = url.parse(uri);

  http.get(options, function(res) {
    var imagedata = "";
    res.setEncoding('binary');

    res.on('data', function(chunk) {
      imagedata += chunk
    });

    res.on('end', function() {
      callback(imagedata);
    })
  })
}

exports.resizeCanvas = function(canvas, width, height) {
  var resizeCanvas = new Canvas(width, height);
  var ctx = resizeCanvas.getContext('2d');
  ctx.patternQuality = "best";

  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height,
                0, 0, width, height);

  return resizeCanvas;
}
