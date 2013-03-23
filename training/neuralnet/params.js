module.exports = {
  HOG: {
    cellSize: 4,
    blockSize: 2,
    blockStride: 1,
    bins: 6,
    norm: "L2"
  },
  nn: {
    hiddenLayers: [10, 10],
    binaryThresh: 0.99
  },
  train: {
    errorThresh: 0.008
  }
}