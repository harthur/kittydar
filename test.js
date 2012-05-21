var kittydar = require("./kittydar"),
    utils = require("./utils");

utils.drawImgToCanvas(__dirname + "/test8.jpg", function(canvas) {
  var cats = kittydar.detectCats(canvas);
  console.log(cats);
})
