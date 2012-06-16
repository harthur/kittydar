# Kittydar

Kittydar is short for kitty radar. Kittydar takes an image (canvas) and tells you the locations of all the cats in the image:

```javascript
var cats = kittydar.detectCats(canvas);

console.log("there are", cats.length, "cats in this photo");

console.log(cats[0]);

// { x: 30, y: 200, width: 140, height: 140 }
```

[Kittydar demo](http://harthur.github.com/kittydar)

# Install

For node:

```bash
npm install kittydar
```

Or grab the [browser file](http://github.com/harthur/kittydar/downloads)

# Specifics

Kittydar takes a `canvas` element. In node you can get a `Canvas` object with [node-canvas](https://github.com/LearnBoost/node-canvas).

Kittydar will give an approximate rectangle around the cat's head. Each rectangle has an `x` and `y` for the top left corner, and a `width` and `height` of the rectangle.

# How it works

Kittydar first chops the image up into many "windows" to test for the presence of a cat head. For each window, kittydar first extracts more tractable data from the image's data. Namely, it computes the [Histogram of Orient Gradients](http://en.wikipedia.org/wiki/Histogram_of_oriented_gradients) descriptor of the image, using the [hog-descriptor](http://github.com/harthur/hog-descriptor) library. This data describes the directions of the edges in the image (where the image changes from light to dark and vice versa) and what strength they are. This data is a vector of numbers that is then fed into a [neural network](https://github.com/harthur/brain) which gives a number from `0` to `1` on how likely the histogram data represents a cat.

The neural network (the JSON of which is located in this repo) has been pre-trained with thousands of photos of cat heads and their histograms, as well as thousands of non-cats. See the repo for the node training scripts.

# Limitations

Kittydar will miss cats sometimes, and sometimes classify non-cats as cats. It's best at detecting upright cats that are facing forward, but it can handle a small tilt or turn in the head.

Kittydar isn't fast. It'll take a few seconds to find the cats in one image. There's lots of room for improvement, so fork and send requests.

### Propers

* This informative reasearch paper: [Cat Head Detection - How to Effectively Exploit Shape and Texture Features](http://research.microsoft.com/pubs/80582/ECCV_CAT_PROC.pdf) by Weiwei Zhang, Jian Sun, and Xiaoou Tang.
* This off the hook [dataset of cat images](http://137.189.35.203/WebUI/CatDatabase/catData.html) annotated with the locations of the cat heads.
* [@gdeglin](http://github.com/gdeglin) for the name.
