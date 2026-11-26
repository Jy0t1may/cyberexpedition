import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeBookmarks, toggleBookmark, isBookmarked, filterBookmarkedNews} from '../src/bookmarks.mjs';

test('decodeBookmarks safely parses stored JSON array and eliminates duplicates', () => {
  assert.deepEqual(decodeBookmarks('["url-1","url-2","url-1"]'), ['url-1', 'url-2']);
  assert.deepEqual(decodeBookmarks(''), []);
  assert.deepEqual(decodeBookmarks(null), []);
  assert.deepEqual(decodeBookmarks('invalid json{]'), []);
  assert.deepEqual(decodeBookmarks('{"not":"an array"}'), []);
});

test('toggleBookmark adds unbookmarked item and removes existing bookmark', () => {
  const empty = [];
  const one = toggleBookmark(empty, 'https://example.com/story-1');
  assert.deepEqual(one, ['https://example.com/story-1']);

  const two = toggleBookmark(one, 'https://example.com/story-2');
  assert.deepEqual(two, ['https://example.com/story-1', 'https://example.com/story-2']);

  const removed = toggleBookmark(two, 'https://example.com/story-1');
  assert.deepEqual(removed, ['https://example.com/story-2']);
});

test('isBookmarked returns true only when item is present', () => {
  const bookmarks = ['https://example.com/story-1'];
  assert.equal(isBookmarked(bookmarks, 'https://example.com/story-1'), true);
  assert.equal(isBookmarked(bookmarks, 'https://example.com/story-2'), false);
  assert.equal(isBookmarked(null, 'https://example.com/story-1'), false);
  assert.equal(isBookmarked(undefined, 'https://example.com/story-1'), false);
});

test('filterBookmarkedNews filters articles matching bookmarks by URL or ID', () => {
  const articles = [
    {id: '1', url: 'https://example.com/1', title: 'Story 1'},
    {id: '2', url: 'https://example.com/2', title: 'Story 2'},
    {id: '3', url: 'https://example.com/3', title: 'Story 3'}
  ];
  const bookmarks = ['https://example.com/2'];
  const filtered = filterBookmarkedNews(articles, bookmarks);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].title, 'Story 2');
});
