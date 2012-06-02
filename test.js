var assert = require("assert");

r1 = { x: 204,
  y: 285.59999999999997,
  width: 183.6,
  height: 183.6,
  prob: 0.9812387701219626 }

r2 = { x: '187', y: '71', width: '207', height: '207' }

doesOverlap(r2, r1);

process.exit(1);

function test(r1, r2, expected) {
  var overlaps = doesOverlap(r1, r2);

  assert.equal(overlaps, expected, JSON.stringify(r1) + JSON.stringify(r2));
}

var r1 = {x: 0, y: 0, width: 10, height: 10};
var r2 = {x: 0, y: 20, width: 10, height: 10};

test(r1, r2, false);
test(r2, r1, false);

r1 = {x: 0, y: 0, width: 10, height: 10};
r2 = {x: 20, y: 0, width: 10, height: 10};

test(r1, r2, false);
test(r2, r1, false);

r1 = {x: 0, y: 0, width: 10, height: 10};
r2 = {x: 5, y: 5, width: 10, height: 10};

test(r1, r2, false);
test(r2, r1, false);

r1 = {x: 0, y: 0, width: 10, height: 10};
r2 = {x: 2, y: 2, width: 10, height: 10};

test(r1, r2, true);
test(r2, r1, true);


r1 = {x: 0, y: 0, width: 10, height: 10};
r2 = {x: 2, y: 2, width: 8, height: 8};

test(r1, r2, true);
test(r2, r1, true);

r1 = {x: 0, y: 0, width: 10, height: 10};
r2 = {x: 2, y: 2, width: 1, height: 1};

test(r1, r2, false);
test(r2, r1, false);

r1 = {x: 187, y: 71, width: 207, height: 207};
r2 = {x: 204, y: 285.599999999999997, width: 183.6, height: 183.6};

test(r1, r2, false);
test(r2, r1, false);

function doesOverlap(cat, rect) {
  var overlapW, overlapH;

  if (cat.x > rect.x) {
    overlapW = Math.min((rect.x + rect.width) - cat.x, cat.width);
  }
  else {
    overlapW = Math.min((cat.x + cat.width) - rect.x, rect.width);
  }

  if (cat.y > rect.y) {
    overlapH = Math.min((rect.y + rect.height) - cat.y, cat.height);
  }
  else {
    overlapH = Math.min((cat.y + cat.height) - rect.y, rect.height);
  }

  console.log(overlapW, overlapH);

  if (overlapW <= 0 || overlapH <= 0) {
    return false;
  }
  var intersect = overlapW * overlapH;
  var union = (cat.width * cat.height) + (rect.width * rect.height) - (intersect * 2);

  if (intersect / union > 0.5) {
    return true;
  }
  return false;
}