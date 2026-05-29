/**
 * Fuzzy search utility to support "amn -> aiman" style searching.
 * @param {string} query - The search string.
 * @param {Array} list - The list of objects to filter.
 * @param {Array<string>} keys - The object keys to search within.
 * @returns {Array} - The filtered list.
 */
export function fuzzySearch(query, list, keys) {
  if (!query) return list;
  const q = query.toLowerCase();
  
  return list.filter(item => {
    return keys.some(key => {
      const val = (item[key] || '').toLowerCase();
      // 1. Check direct substring match (fast)
      if (val.includes(q)) return true;
      
      // 2. Check fuzzy sequence (a...m...n)
      let i = 0; // index for query
      let j = 0; // index for value
      while (i < q.length && j < val.length) {
        if (q[i] === val[j]) {
          i++;
        }
        j++;
      }
      return i === q.length;
    });
  });
}
