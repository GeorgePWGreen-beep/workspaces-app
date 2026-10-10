/** Name-only search. Apostrophes join words; other punctuation separates them. */
export function normalizeCafeSearch(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/['’‘]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function editDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 0; i < left.length; i++) {
    const row = [i + 1];
    for (let j = 0; j < right.length; j++) {
      row.push(Math.min(row[j] + 1, previous[j + 1] + 1, previous[j] + Number(left[i] !== right[j])));
    }
    previous = row;
  }
  return previous[right.length];
}

/** Lower is better. Separate tiers keep even a strong typo below a substring. */
export function cafeNameSearchRank(name: string, query: string): number | null {
  const normalized = normalizeCafeSearch(name);
  const search = normalizeCafeSearch(query);
  if (!search || normalized === search) return 0;
  if (normalized.startsWith(search)) return 100;
  const words = normalized.split(" ");
  if (words.some((_, index) => words.slice(index).join(" ").startsWith(search))) return 200;
  if (normalized.includes(search)) return 300;

  // Short/numeric queries need literal matches to avoid noisy suggestions.
  if (search.length < 4 || !/\p{L}/u.test(search)) return null;
  const tolerance = search.length >= 6 ? 2 : 1;
  const wordCount = search.split(" ").length;
  let best = tolerance + 1;
  for (let i = 0; i < words.length; i++) {
    const candidate = words.slice(i, i + wordCount).join(" ");
    if (Math.abs(candidate.length - search.length) > tolerance) continue;
    best = Math.min(best, editDistance(search, candidate));
  }
  return best <= tolerance ? 400 + best : null;
}

export function searchCafes<T extends { name: string; studyScore: number }>(cafes: readonly T[], query: string): T[] {
  if (!normalizeCafeSearch(query)) return [...cafes];
  return cafes.map(cafe => ({ cafe, rank: cafeNameSearchRank(cafe.name, query) }))
    .filter((entry): entry is { cafe: T; rank: number } => entry.rank !== null)
    .sort((a, b) => a.rank - b.rank || b.cafe.studyScore - a.cafe.studyScore || a.cafe.name.localeCompare(b.cafe.name))
    .map(entry => entry.cafe);
}

/** A score tie is ambiguous, even if Study Score puts one cafe first. */
export function obviousCafeResult<T extends { name: string }>(results: readonly T[], query: string): T | null {
  if (!results.length) return null;
  if (results.length === 1) return results[0];
  const first = cafeNameSearchRank(results[0].name, query);
  const second = cafeNameSearchRank(results[1].name, query);
  return first !== null && second !== null && first < second ? results[0] : null;
}
