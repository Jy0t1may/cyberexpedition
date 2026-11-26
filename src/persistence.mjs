export async function saveRoadmap(state, write, status) {
  status('Saving…');
  try {
    await write(state);
    status('Saved automatically on this device.');
    return state;
  } catch (error) {
    status('Could not save roadmap. Try again.');
    throw error;
  }
}

export async function saveBookmarks(bookmarks, write, status) {
  if (status) status('Saving bookmarks…');
  try {
    await write(bookmarks);
    if (status) status('Bookmarks saved.');
    return bookmarks;
  } catch (error) {
    if (status) status('Could not save bookmarks.');
    throw error;
  }
}
