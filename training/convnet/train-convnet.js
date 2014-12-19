var convnet = require("convnetjs");

var layers = [];
layers.push({type:'input', out_sx:32, out_sy:32, out_depth:3}); // declare size of input
// output Vol is of size 32x32x3 here
layers.push({type:'conv', sx:5, filters:16, stride:1, pad:2, activation:'relu'});
// the layer will perform convolution with 16 kernels, each of size 5x5.
// the input will be padded with 2 pixels on all sides to make the output Vol of the same size
// output Vol will thus be 32x32x16 at this point
layers.push({type:'pool', sx:2, stride:2});
// output Vol is of size 16x16x16 here
layers.push({type:'conv', sx:5, filters:20, stride:1, pad:2, activation:'relu'});
// output Vol is of size 16x16x20 here
layers.push({type:'pool', sx:2, stride:2});
// output Vol is of size 8x8x20 here
layers.push({type:'conv', sx:5, filters:20, stride:1, pad:2, activation:'relu'});
// output Vol is of size 8x8x20 here
layers.push({type:'pool', sx:2, stride:2});
// output Vol is of size 4x4x20 here
layers.push({type:'softmax', num_classes:10});
// output Vol is of size 1x1x10 here

net = new convnet.Net();
net.makeLayers(layers);

// helpful utility for converting images into Vols is included
var x = convnet.img_to_vol(document.getElementById('#some_image'))
var output_probabilities_vol = net.forward(x)
