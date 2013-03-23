module.exports = {
  HOG: {
    cellSize: 4,
    blockSize: 2,
    blockStride: 1,
    bins: 7,
    norm: "L2"
  },
  svm: {
    numpasses: 5,
    C: 0.001,
  }
};