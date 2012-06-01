var assert = require("assert");


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
test(r2, r1, true);


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

  if (overlapW > 0 && overlapH > 0) {
    return (overlapH * overlapW) > (cat.width * cat.height * 0.5);
  }
  return false;
}
