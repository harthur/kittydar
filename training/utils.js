var url = require("url"),
    fs = require("fs"),
    http = require("http"),
    Canvas = require("canvas");

exports.zeros = function(size) {
  var array = new Array(size);
  for (var i = 0; i < size; i++) {
    array[i] = 0;
  }
  return array;
}

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

exports.dataToCanvas = function(imagedata, resize) {
  img = new Canvas.Image();
  img.src = new Buffer(imagedata, 'binary');

  var canvas = new Canvas(resize, resize);
  var ctx = canvas.getContext('2d');
  ctx.patternQuality = "best";

  ctx.drawImage(img, 0, 0, img.width, img.height,
    0, 0, resize, resize);
  return canvas;
}

exports.drawImgToCanvas = function(file, resize, callback) {
  fs.readFile(file, function(err, data) {
    if (err) throw err;
    var canvas = exports.dataToCanvas(data, resize);

    callback(canvas);
  });
}

exports.drawImgToCanvasSync = function(file, resize) {
  var data = fs.readFileSync(file)
  var canvas = exports.dataToCanvas(data, resize);
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

exports.downloadImage = function(uri, dest, callback) {
  var options = url.parse(uri);

  var request = http.get(options, function(res){
    var imagedata = ''
    res.setEncoding('binary')

    res.on('data', function(chunk){
        imagedata += chunk
    })

    res.on('end', function(){
      fs.writeFile(dest, imagedata, 'binary', function(err) {
        if (err) throw err
        callback();
      })
    })
  })
}

