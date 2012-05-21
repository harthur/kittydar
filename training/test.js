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
    // open .rect file

    utils.drawImgToCanvas(file, function(canvas) {
      var cats = kittydar.detectCats(canvas);

      // test against rect
    })
  });
});


