var brain = require("brain"),
    utils = require("utils"),
    kittydar = require("../kittydar"),
    network = require("./network.json");


var dir = "/TEST/";

fs.readdir(dir, function(err, files) {
  if (err) throw err;

  var images = files.filter(function(file) {
    return path.extname(file) == ".jpg";
  })

  async.forEach(images, function(file, done) {
    fs.readFile(file + ".rect", "utf-8", function(text) {
      var vals = text.split(" ");
      var rect = {
        x: vals[0],
        y: vals[1],
        width: vals[2],
        height: vals[3]
      };

      utils.drawImgToCanvas(file, function(canvas) {
        var cats = kittydar.detectCats(canvas);
        cats.forEach(function(cat) {
          if (doesOverlap(cat, rect)) {
            // true positive
          }
          else {
            // false positive
          }
        });
      });
    })
  });
});


function doesOverlap(rect1, rect2) {
  if ()
}

