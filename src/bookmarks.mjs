export function decodeBookmarks(saved) {
  if (!saved || typeof saved !== 'string') return [];
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter(item => typeof item === 'string' && item.trim().length > 0))];
  } catch {
    return [];
  }
}

export function toggleBookmark(bookmarks, item) {
  const list = Array.isArray(bookmarks) ? bookmarks : [];
  if (!item || typeof item !== 'string') return [...list];
  return list.includes(item)
    ? list.filter(b => b !== item)
    : [...list, item];
}

export function isBookmarked(bookmarks, item) {
  if (!Array.isArray(bookmarks) || !item) return false;
  return bookmarks.includes(item);
}

export function filterBookmarkedNews(articles, bookmarks) {
  if (!Array.isArray(articles)) return [];
  const set = new Set(Array.isArray(bookmarks) ? bookmarks : []);
  if (!set.size) return [];
  return articles.filter(a => set.has(a.url) || set.has(a.id));
}
