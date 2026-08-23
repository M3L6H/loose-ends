/**
 * Sort array based on cmp.
 *
 * @param {any[]} arr - Array to sort
 * @param {Function} cmp - Comparison function to use
 */
export function sortInPlace(arr, cmp) {
  if (!arr || arr.length <= 1) {
    return;
  }

  for (let i = 1; i < arr.length; i++) {
    const current = arr[i];
    let j = i - 1;
    for (; j >= 0 && cmp(arr[j], current) > 0; --j) {
      arr[j + 1] = arr[j];
    }
    arr[j + 1] = current;
  }
}

/**
 * Insert into sorted array using cmp.
 *
 * @param {any} elt - The element to insert
 * @param {any[]} arr - Sorted array to insert into
 * @param {Function} cmp - Comparison function to use
 */
export function insertInSortedArr(elt, arr, cmp) {
  const i = bSearch(elt, arr, cmp);
  // bSearch returns the index of the closest smaller element or -1
  // We need to insert after that index
  const insertIndex = i + 1;
  const res = arr.slice(0, insertIndex);
  res.push(elt);
  res.push(...arr.slice(insertIndex));
  return res;
}

/**
 * Perform binary search in the given array.
 * Finds the index closest element to elt using cmp.
 * If an element is not found, returns the element "smaller" than elt as defined by cmp.
 * If the smallest element in arr is larger than elt, will return -1.
 *
 * @param {any} elt - The element to look for
 * @param {any[]} arr - Sorted array to search in
 * @param {Function} cmp - Comparison function to use
 *
 * @returns {number} The index of the closest element to elt or -1
 */
export function bSearch(elt, arr, cmp) {
  let a = 0;
  let b = (arr ?? []).length;
  let res = -1;

  while (a < b) {
    const m = a + Math.floor((b - a) / 2);
    const cmpResult = cmp(elt, arr[m]);

    if (cmpResult < 0) {
      b = m;
    } else if (cmpResult > 0) {
      res = m; // m is a candidate for the index of the closest smaller element
      a = m + 1;
    } else {
      return m;
    }
  }

  return res;
}
