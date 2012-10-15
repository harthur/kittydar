# Training

The goal of training is to create a classifier (in this case a neural network) that can be used to classify cat head images.

After a final round of training you should have the JSON state of a neural network in the file "network.json", which can be imported and used by kittydar.

## collection

First you need to collect positive and negative images to train the network with. See the `collection` directory for more information.

## train the classifier

You can train a network with:

```
node train-network.js POSITIVES NEGATIVES
```

where POSITIVES is the directory of positive images (cat head crops), and NEGATIVES is a directory of samples from non-cat images.

This will write the network to "network.json".

## test the classifier

After training the network you can test the network on a set of test positive and negative images (different from the ones that trained it):

```
node test-network.js POSITIVES_TEST NEGATIVES_TEST --network ./network.json
```

This will report the neural network error, as well as binary classification statistics like precision and recall.

## optional: finding optimal parameters

Find the best parameters for the feature extraction and classifier with cross-validation. Edit the `combos` object to add a combination and run with:

```
node cross-validate.js POSITIVES NEGATIVES
```

This will cross-validate on each combination of parameteres and report statistics on each combination, including the precision, recall, accuracy, and error of the test set.

## optional: mining hard negatives

After you've trained a classifier, you can test the classifier on a different set of negative images and save any false positives as "hard negatives". You can take the hard negatives and the positives and train a new (more precise) classifier.

```
node mine-negatives.js NEGATIVES_EXTRA HARD --samples 1 --network ./network.json
```

where `HARD` is a new directory to hold the mined negatives. The `threshold` param determines when a negative is classified as hard. It's a number from 0.5 to 1.0 (from "leaning positive" to very false positive).

`samples` is the number of times to sample each negative image. It can take a lot of images to find a few hard negatives if you're classifier is good enough, so specifying a higher value will mine more hard negatives in the end.

You can then train a new classifier with:

```
node train-network.js POSITIVES HARD
```

