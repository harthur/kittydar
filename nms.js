/* non-maximum suppression - combine overlapping rects into the strongest one */

exports.combineOverlaps = combineOverlaps;
exports.doesOverlap = doesOverlap;

/* rects is an array of objects that look like:
 *  {
 *    x: // top left x coordinate,
 *    y: // lop left y coordinate,
 *    width: // width of rect,
 *    height: // height of rect,
 *    value: // rect with a higher value will suppress a rect with a lower value
 *  }
 *
 * minRatio is the min ratio of intersection area to union area of two rects
 * to qualify them as overlapping.
 *
 * minOverlaps is the number of suppressions required for a rect
 * to be included in the final returned set.
 */
function combineOverlaps(rects, minRatio, minOverlaps) {
  minRatio = minRatio || 0.5;
  minOverlaps = minOverlaps || 1;

  for (var i = 0; i < rects.length; i++) {
    var r1 = rects[i];
    r1.tally = 0; // number of rects it's suppressed

    for (var j = 0; j < i; j++) {
      var r2 = rects[j];

      if (doesOverlap(r1, r2, minRatio)) {
        if (r1.value > r2.value) {
          r2.suppressed = true;
          r1.tally += 1 + r2.tally;
        }
        else {
          r1.suppressed = true;
          r2.tally += 1 + r1.tally;
        }
      }
    }
  }
  // only take a rect if it wasn't suppressed by any other rect
  return rects.filter(function(rect) {
    return !rect.suppressed && rect.tally >= minOverlaps;
  })
}

function doesOverlap(r1, r2, minRatio) {
  minRatio = minRatio || 0.5;

  var overlapW, overlapH;
  if (r1.x > r2.x) {
    overlapW = Math.min((r2.x + r2.width) - r1.x, r1.width);
  }
  else {
    overlapW = Math.min((r1.x + r1.width) - r2.x, r2.width);
  }

  if (r1.y > r2.y) {
    overlapH = Math.min((r2.y + r2.height) - r1.y, r1.height);
  }
  else {
    overlapH = Math.min((r1.y + r1.height) - r2.y, r2.height);
  }

  if (overlapW <= 0 || overlapH <= 0) {
    return false;
  }
  var intersect = overlapW * overlapH;
  var union = (r1.width * r1.height) + (r2.width * r2.height) - (intersect * 2);

  return intersect / union > minRatio;
}
