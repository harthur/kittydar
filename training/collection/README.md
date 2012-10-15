## collection

the goal of collection is to get a folder of positive (cat head) images and a folder of negative (non-cat) images to train the classifier with.

### creating the positives

To get the positives, first download this [dataset of cat pictures](http://137.189.35.203/WebUI/CatDatabase/catData.html). There should be folders called CAT_00, CAT_01, etc. Take the images from all of these and combine into one directory. Also remove the file "00000003_019.jpg.cat" and add [00000003_015.jpg.cat](http://137.189.35.203/WebUI/CatDatabase/Data/00000003_015.jpg.cat).

Run the script to rotate and the crop out the cat head from each image. If you put the cat dataset in a folder called "CATS" and you want to put the cropped images in a folder called "POSITIVES":

`node make-positives.js CATS POSITIVES`

### creating the negatives

If you don't already have a bunch of non-cat pictures you can fetch recent images from Flickr and save them in a folder called "FLICKR" by running:

`ruby fetch-negatives.rb NEGATIVES`

You'll need at least 10,000 images.

To turn the full-sized images into negatives that can be used directly for training or testing, sample them with:

`node make-negatives NEGATIVES NEGATIVES_SAMPLED`

Where `NEGATIVES_SAMPLED` is the directory to contain the sampled images.

If you're getting images from Flickr, some will contain cats for sure, so you'll need to weed those out by taking a close look at your hard negatives (see `training` directory above).



