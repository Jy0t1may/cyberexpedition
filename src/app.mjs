import {Capacitor, CapacitorHttp, SystemBars, SystemBarsStyle} from '@capacitor/core';
import {Filesystem, Directory, Encoding} from '@capacitor/filesystem';
import {Preferences} from '@capacitor/preferences';
import {Browser} from '@capacitor/browser';
import {FEEDS, refreshFeeds} from './feed.mjs';
import {CATEGORIES, filterNews, filterCerts, categoriesFor} from './discovery.mjs';
import {toggle, move, complete, decodeRoute, clearRoute, calcProgress} from './roadmap.mjs';
import {openArticle} from './article.mjs';
import {saveRoadmap, saveBookmarks} from './persistence.mjs';
import {decodeBookmarks, toggleBookmark, isBookmarked} from './bookmarks.mjs';

const $ = id => document.getElementById(id);
const seed = window.__NEWS__ || {sources: [], articles: []};
const certs = (window.__CERTIFICATIONS__ || []).map((row, index) => ({...row, id: `cert-${index}`}));
const byId = new Map(certs.map(c => [c.id, c]));

const domains = {
  redops: 'Offensive security',
  blueops: 'Defensive security',
  engineer: 'Security engineering',
  network: 'Network security',
  software: 'Application security',
  iam: 'Identity and access',
  mgmt: 'Governance & Risk',
  test: 'Audit and testing',
  asset: 'Asset & Privacy'
};

let news = seed;
let roadmap = {ids: [], done: []};
let bookmarks = [];
let current = 'news';
let shown = 45;
let busy = false;
let sheetOpener = null;
let newsFilter = {source: 'all', categories: [], query: '', bookmarkedOnly: false};
let certDomain = 'all';

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = String(text);
  return node;
};

const date = value => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : 'Unknown';
const level = value => Number(value) >= 19 ? 'Beginner' : Number(value) >= 10 ? 'Intermediate' : 'Advanced';
const note = (id, message) => { const target = $(id); if (target) target.textContent = message; };

function external(url, label) {
  const a = el('a', '', label);
  try {
    const u = new URL(url);
    if (!['https:', 'http:'].includes(u.protocol)) throw Error();
    a.href = u.href;
    a.rel = 'noopener noreferrer';
    a.target = '_blank';
    if (Capacitor.isNativePlatform()) {
      a.onclick = e => {
        e.preventDefault();
        Browser.open({url: u.href}).catch(() => {});
      };
    }
  } catch {
    a.textContent = 'Link unavailable';
  }
  return a;
}

function show(name) {
  if (current === name) return;
  current = name;
  for (const key of ['news', 'certs', 'route']) {
    $(key + '-view').hidden = key !== name;
    $('tab-' + key).setAttribute('aria-current', key === name ? 'page' : 'false');
  }
  window.scrollTo(0, 0);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $(name + '-view').animate([{opacity: 0.8, transform: 'translateY(4px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 140, easing: 'cubic-bezier(.22,1,.36,1)'});
  }
}

let sheetExit = null;
function finishSheetClose() {
  if ($('sheet-backdrop').hidden) return;
  $('sheet-backdrop').hidden = true;
  document.body.classList.remove('sheet-open');
  $('sheet-body').replaceChildren();
  $('sheet-actions').replaceChildren();
  sheetOpener?.focus();
  sheetOpener = null;
}

function closeSheet() {
  if ($('sheet-backdrop').hidden || sheetExit) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finishSheetClose();
    return;
  }
  sheetExit = $('sheet').animate([{opacity: 1, transform: 'translateY(0)'}, {opacity: 0, transform: 'translateY(16px)'}], {duration: 150, easing: 'ease-in'});
  sheetExit.onfinish = () => { sheetExit = null; finishSheetClose(); };
  sheetExit.oncancel = () => { sheetExit = null; };
}

function openSheet(title, body, actions = []) {
  if (sheetExit) { sheetExit.cancel(); sheetExit = null; }
  sheetOpener = document.activeElement;
  $('sheet-title').textContent = title;
  $('sheet-body').replaceChildren(body);
  $('sheet-actions').replaceChildren(...actions);
  $('sheet-backdrop').hidden = false;
  document.body.classList.add('sheet-open');
  $('sheet-close').focus();
}

$('sheet-close').onclick = closeSheet;
$('sheet-backdrop').onclick = e => { if (e.target === $('sheet-backdrop')) closeSheet(); };

document.addEventListener('keydown', e => {
  if ($('sheet-backdrop').hidden) return;
  if (e.key === 'Escape') { closeSheet(); return; }
  if (e.key === 'Tab') {
    const nodes = [...$('sheet').querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')];
    if (!nodes.length) return;
    const first = nodes[0], last = nodes.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

function action(text, onClick, cls = 'quiet') {
  const button = el('button', cls, text);
  button.type = 'button';
  button.onclick = onClick;
  return button;
}

function choice(type, name, value, label, checked) {
  const line = el('label', 'choice'), input = el('input');
  input.type = type;
  input.name = name;
  input.value = value;
  input.checked = checked;
  line.append(input, el('span', '', label));
  return {line, input};
}

async function persistBookmarks() {
  try {
    await saveBookmarks(bookmarks, data => Preferences.set({key: 'bookmarks-v1', value: JSON.stringify(data)}));
  } catch {
    note('update-status', 'Could not save bookmark changes.');
  }
  updateBookmarkCount();
}

function updateBookmarkCount() {
  const countEl = $('bookmark-count');
  if (countEl) countEl.textContent = bookmarks.length;
}

async function handleToggleBookmark(urlOrId) {
  bookmarks = toggleBookmark(bookmarks, urlOrId);
  await persistBookmarks();
  drawNews();
}

function openNewsFilters() {
  let source = newsFilter.source, selected = new Set(newsFilter.categories), body = el('div');
  body.append(el('h3', '', 'News sources'));
  for (const option of [{id: 'all', name: 'All sources'}, ...(news.sources || [])]) {
    const {line, input} = choice('radio', 'news-source', option.id, option.name, source === option.id);
    input.onchange = () => source = option.id;
    body.append(line);
  }
  body.append(el('h3', '', 'Categories'));
  for (const [key, label] of CATEGORIES) {
    const {line, input} = choice('checkbox', 'news-category', key, label, selected.has(key));
    input.onchange = () => input.checked ? selected.add(key) : selected.delete(key);
    body.append(line);
  }
  openSheet('Filter news', body, [
    action('Clear', () => {
      newsFilter = {...newsFilter, source: 'all', categories: []};
      drawNews();
      closeSheet();
    }),
    action('Apply Filters', () => {
      newsFilter = {...newsFilter, source, categories: [...selected]};
      drawNews();
      closeSheet();
    }, 'primary')
  ]);
}

function openCertFilters() {
  let domain = certDomain, body = el('div');
  for (const key of ['all', ...[...new Set(certs.map(c => c.main_domain).filter(Boolean))].sort()]) {
    const {line, input} = choice('radio', 'cert-domain', key, key === 'all' ? 'All career areas' : domains[key] || key, domain === key);
    input.onchange = () => domain = key;
    body.append(line);
  }
  openSheet('Career area', body, [
    action('All areas', () => {
      certDomain = 'all';
      shown = 45;
      drawCerts();
      closeSheet();
    }),
    action('Apply', () => {
      certDomain = domain;
      shown = 45;
      drawCerts();
      closeSheet();
    }, 'primary')
  ]);
}

async function launchArticle(url) {
  const result = await openArticle(url, {
    native: Capacitor.isNativePlatform(),
    openNative: u => Browser.open({url: u}),
    openWeb: u => {
      const opened = window.open(u, '_blank');
      if (opened) opened.opener = null;
      return opened;
    }
  });
  if (!result.ok) {
    note('update-status', result.reason === 'invalid-url' ? 'Source link is invalid or unavailable.' : 'Could not open article. Ensure you are connected to the internet.');
  }
}

function openStoryReader(row) {
  const body = el('div');
  const bookmarked = isBookmarked(bookmarks, row.url || row.id);

  const tags = categoriesFor(row);
  const tagList = el('div', 'tag-list');
  for (const tag of tags) {
    const matching = CATEGORIES.find(c => c[0] === tag);
    tagList.append(el('span', 'tag-pill', matching ? matching[1] : tag));
  }

  body.append(
    el('p', 'source', `${row.sourceName || row.source || 'Security Publisher'} · ${date(row.published)}`),
    tagList,
    el('p', '', row.extract || 'No preview available. Open the source publication for full context.'),
    el('p', 'sub', 'Note: In accordance with copyright practices, the full article remains hosted on the original publisher\'s site.')
  );

  const bookmarkBtn = action(bookmarked ? '★ Bookmarked' : '☆ Bookmark story', async () => {
    await handleToggleBookmark(row.url || row.id);
    closeSheet();
  }, bookmarked ? 'quiet active' : 'quiet');

  const openBtn = action('Read at publisher ↗', () => {
    closeSheet();
    launchArticle(row.url);
  }, 'primary');

  openSheet(row.title || 'Security News Digest', body, [bookmarkBtn, openBtn]);
}

function drawNews() {
  const query = $('news-search').value;
  const rows = filterNews(news.articles || [], {...newsFilter, query, bookmarks});
  
  const fCount = newsFilter.categories.length + (newsFilter.source === 'all' ? 0 : 1);
  $('news-filter').textContent = fCount ? `Filters (${fCount})` : 'Filters';
  $('news-filter').classList.toggle('active', fCount > 0);

  const bookmarkBtn = $('news-bookmarks');
  if (bookmarkBtn) {
    bookmarkBtn.classList.toggle('active', newsFilter.bookmarkedOnly);
    bookmarkBtn.setAttribute('aria-pressed', String(newsFilter.bookmarkedOnly));
  }
  updateBookmarkCount();

  const total = news.articles?.length || 0;
  note('news-count', newsFilter.bookmarkedOnly 
    ? `${rows.length} bookmarked ${rows.length === 1 ? 'story' : 'stories'}`
    : `${rows.length} of ${total} stories`);

  const list = $('stories');
  list.replaceChildren();

  if (!rows.length) {
    const empty = el('div', 'empty');
    if (newsFilter.bookmarkedOnly) {
      empty.append(
        el('p', '', 'No bookmarked stories yet.'),
        action('Show all news', () => {
          newsFilter.bookmarkedOnly = false;
          drawNews();
        }, 'primary small-btn')
      );
    } else {
      empty.append(
        el('p', '', 'No stories match your search or filter criteria.'),
        action('Reset filters & search', () => {
          $('news-search').value = '';
          newsFilter = {source: 'all', categories: [], query: '', bookmarkedOnly: false};
          drawNews();
        }, 'primary small-btn')
      );
    }
    list.append(empty);
    return;
  }

  for (const row of rows) {
    const card = el('article', 'card story');
    const bookmarked = isBookmarked(bookmarks, row.url || row.id);

    // Card header row
    const headRow = el('div', 'card-header-row');
    headRow.append(el('span', 'source', `${row.sourceName || row.source || 'Source'} · ${date(row.published)}`));
    
    // Quick bookmark toggle button
    const bmBtn = action(bookmarked ? '★' : '☆', async e => {
      e.stopPropagation();
      await handleToggleBookmark(row.url || row.id);
    }, `bookmark-toggle-btn ${bookmarked ? 'bookmarked' : ''}`);
    bmBtn.setAttribute('aria-label', bookmarked ? 'Remove bookmark' : 'Bookmark story');
    headRow.append(bmBtn);
    card.append(headRow);

    // Main tap target for in-app reader sheet
    const open = action('', () => openStoryReader(row), 'story-open');
    open.setAttribute('aria-label', `Read digest: ${row.title || 'Untitled'}`);

    const tags = categoriesFor(row).slice(0, 3);
    const tagList = el('div', 'tag-list');
    for (const tag of tags) {
      const match = CATEGORIES.find(c => c[0] === tag);
      tagList.append(el('span', 'tag-pill', match ? match[1] : tag));
    }

    open.append(
      el('span', 'story-title', row.title || 'Untitled'),
      tagList,
      el('span', 'story-preview', row.extract || 'Tap to read preview.'),
      el('span', 'read-label', 'Open digest & details →')
    );
    card.append(open);
    list.append(card);
  }
}

async function save(next) {
  const saved = await saveRoadmap(next, data => Preferences.set({key: 'roadmap-v2', value: JSON.stringify(data)}), message => note('route-status', message));
  roadmap = saved;
  drawCerts();
  drawRoadmap();
}

function certCard(row) {
  const card = el('article', 'card');
  const inRoadmap = roadmap.ids.includes(row.id);

  const headRow = el('div', 'card-header-row');
  headRow.append(el('span', 'source', `${domains[row.main_domain] || row.main_domain || 'Other'} · ${level(row.skill_row)}`));
  if (inRoadmap) {
    headRow.append(el('span', 'in-roadmap-pill', '✓ In Roadmap'));
  }
  card.append(headRow);

  card.append(
    el('h2', '', row.full_name || row.acronym),
    el('p', 'sub', `${row.acronym || ''} · ${row.cost_notes || 'Confirm price and exam prerequisites with issuer.'}`)
  );

  const buttons = el('div', 'card-actions');
  buttons.append(
    action(inRoadmap ? 'Remove' : '+ Add to roadmap', async () => {
      try {
        await save(toggle(roadmap, row.id));
      } catch {
        note('route-status', 'Could not save roadmap. Try again.');
      }
    }, inRoadmap ? 'quiet' : 'quiet active'),
    action('Details', () => details(row)),
    external(row.official_url, 'Official site ↗')
  );
  card.append(buttons);
  return card;
}

function drawCerts() {
  const query = $('cert-search').value;
  const rows = filterCerts(certs, query, certDomain);
  
  $('cert-filter').textContent = certDomain === 'all' ? 'All areas' : domains[certDomain] || certDomain;
  $('cert-filter').classList.toggle('active', certDomain !== 'all');
  note('cert-count', `${rows.length} of ${certs.length} certifications`);

  const container = $('certs');
  container.replaceChildren();

  if (!rows.length) {
    const empty = el('div', 'empty');
    empty.append(
      el('p', '', 'No certifications match your query or category filter.'),
      action('Reset filters', () => {
        $('cert-search').value = '';
        certDomain = 'all';
        shown = 45;
        drawCerts();
      }, 'primary small-btn')
    );
    container.append(empty);
    $('more').hidden = true;
    return;
  }

  container.append(...rows.slice(0, shown).map(certCard));
  $('more').hidden = shown >= rows.length;
}

function details(row) {
  const body = el('div'), dl = el('dl');
  const inRoadmap = roadmap.ids.includes(row.id);

  const fields = [
    ['Acronym', row.acronym],
    ['Career domain', domains[row.main_domain] || row.main_domain],
    ['Sub-domain', row.sub_domain || 'General'],
    ['Estimated level', level(row.skill_row)],
    ['Study time', row.study_hours_est ? `${row.study_hours_est} estimated hours` : 'Varies by background'],
    ['Exam duration', row.exam_minutes ? `${row.exam_minutes} minutes` : 'Check issuer format'],
    ['Price / fees', row.cost_notes || row.listed_cost_usd || 'Contact issuer'],
    ['Exam questions', row.exam_questions || 'Standard format'],
    ['Validity period', row.validity_years ? `${row.validity_years} years` : 'Check renewal policy']
  ];

  for (const [label, value] of fields) {
    const line = el('div', 'detail');
    line.append(el('dt', '', label), el('dd', '', value || 'Not listed'));
    dl.append(line);
  }

  body.append(
    el('p', '', row.full_name || row.acronym),
    dl,
    el('p', 'sub', 'Exam content, pricing, and prerequisites may change over time. Verify with the issuer prior to registration.')
  );

  const toggleBtn = action(inRoadmap ? 'Remove from roadmap' : 'Add to roadmap', async () => {
    try {
      await save(toggle(roadmap, row.id));
      closeSheet();
    } catch {
      note('route-status', 'Could not update roadmap.');
    }
  }, inRoadmap ? 'quiet' : 'primary');

  openSheet(row.acronym || 'Certification details', body, [
    toggleBtn,
    external(row.official_url, 'Official course or exam page ↗')
  ]);
}

function drawRoadmap() {
  const list = $('route');
  list.replaceChildren();
  
  $('count').textContent = roadmap.ids.length;
  const progress = calcProgress(roadmap, byId);

  const progressBox = $('route-progress-box');
  const headerActions = $('route-header-actions');

  if (!roadmap.ids.length) {
    if (progressBox) progressBox.hidden = true;
    if (headerActions) headerActions.hidden = true;

    const empty = el('li', 'empty');
    empty.append(
      el('p', '', 'Your study roadmap is currently empty.'),
      el('p', 'sub', 'Add certifications from the Certifications tab to plan your path and track your study progress.'),
      action('Explore Certifications', () => show('certs'), 'primary small-btn')
    );
    list.append(empty);
    return;
  }

  if (progressBox) {
    progressBox.hidden = false;
    $('route-progress-title').textContent = `${progress.completed} of ${progress.total} completed (${progress.percentage}%)`;
    $('route-progress-sub').textContent = progress.estimatedHours > 0 
      ? `${progress.completedHours}h completed / ${progress.estimatedHours}h total study`
      : `${progress.completed} milestone${progress.completed === 1 ? '' : 's'} achieved`;
    $('route-progress-bar').setAttribute('aria-valuenow', String(progress.percentage));
    $('route-progress-fill').style.width = `${progress.percentage}%`;
  }

  if (headerActions) {
    headerActions.hidden = false;
  }

  roadmap.ids.forEach((id, index) => {
    const row = byId.get(id);
    if (!row) return;

    const isDone = roadmap.done.includes(id);
    const li = el('li', isDone ? 'item-done' : '');

    const card = action('', () => details(row), 'timeline-card');
    card.classList.toggle('done', isDone);
    card.setAttribute('aria-label', `Details for ${row.full_name || row.acronym}`);

    card.append(
      el('span', 'step', `Step ${index + 1} · ${level(row.skill_row)}${isDone ? ' · Completed ✓' : ''}`),
      el('strong', '', row.full_name || row.acronym),
      el('span', 'sub', `${row.acronym || ''} · ${domains[row.main_domain] || row.main_domain || 'Other'}${row.study_hours_est ? ` · ~${row.study_hours_est}h` : ''}`)
    );
    li.append(card);

    const tools = el('div', 'timeline-actions');
    const done = choice('checkbox', '', id, 'Completed', isDone);
    done.input.onchange = async () => {
      try {
        await save(complete(roadmap, id));
      } catch {
        drawRoadmap();
        note('route-status', 'Could not save milestone status.');
      }
    };
    tools.append(done.line);

    for (const [name, step] of [['▲ Up', -1], ['▼ Down', 1]]) {
      const button = action(name, async () => {
        try {
          await save(move(roadmap, id, step));
        } catch {
          note('route-status', 'Could not save milestone order.');
        }
      }, 'small-btn quiet');
      button.disabled = index + step < 0 || index + step >= roadmap.ids.length;
      tools.append(button);
    }

    tools.append(action('Remove', async () => {
      try {
        await save(toggle(roadmap, id));
      } catch {
        note('route-status', 'Could not remove milestone.');
      }
    }, 'small-btn quiet'));

    li.append(tools);
    list.append(li);
  });
}

function promptClearRoadmap() {
  const body = el('div');
  body.append(
    el('p', '', 'Are you sure you want to clear your certification roadmap?'),
    el('p', 'sub', 'All current steps, ordering, and completion checkboxes will be reset.')
  );
  openSheet('Clear Roadmap', body, [
    action('Cancel', closeSheet, 'quiet'),
    action('Clear all milestones', async () => {
      try {
        await save(clearRoute());
        closeSheet();
      } catch {
        note('route-status', 'Could not clear roadmap.');
      }
    }, 'primary')
  ]);
}

function about() {
  const body = el('div');
  body.append(
    el('p', '', 'Cyber Security Expedition is an offline-ready Android app for following cybersecurity news, exploring security certifications, and personal study planning.'),
    el('p', 'sub', 'Engineered with vanilla JavaScript, Capacitor, and DevSecOps automated pipelines (CodeQL SAST, secret scanning, and unit testing).'),
    el('p', '', '© 2026 J.M. All rights reserved.')
  );
  const links = el('div', 'sheet-links');
  for (const [url, label] of [
    ['mailto:jyotirmay.mondal@efrei.net', 'Contact'],
    ['https://github.com/Jy0t1may', 'GitHub Profile'],
    ['https://www.linkedin.com/in/jyotirmay-mondal', 'LinkedIn']
  ]) {
    if (url.startsWith('mailto:')) {
      const a = el('a', '', label);
      a.href = url;
      links.append(a);
    } else {
      links.append(external(url, label));
    }
  }
  body.append(links);
  openSheet('Security Expedition', body);
}

async function loadSaved() {
  // Load cached news from Filesystem
  try {
    const file = await Filesystem.readFile({path: 'news.json', directory: Directory.Data, encoding: Encoding.UTF8});
    const cached = JSON.parse(file.data);
    if (Array.isArray(cached.articles) && Array.isArray(cached.sources) && Date.parse(cached.fetchedAt) > Date.parse(seed.fetchedAt)) {
      news = cached;
    }
  } catch {}

  // Load saved roadmap from Preferences
  try {
    const v2 = (await Preferences.get({key: 'roadmap-v2'})).value;
    const old = (await Preferences.get({key: 'roadmap-v1'})).value;
    roadmap = decodeRoute(v2, old, new Set(byId.keys()));
    if (!v2 && old && roadmap.ids.length) {
      await Preferences.set({key: 'roadmap-v2', value: JSON.stringify(roadmap)});
    }
  } catch {}

  // Load saved bookmarks from Preferences
  try {
    const savedBookmarks = (await Preferences.get({key: 'bookmarks-v1'})).value;
    bookmarks = decodeBookmarks(savedBookmarks);
  } catch {}

  drawNews();
  drawCerts();
  drawRoadmap();
  note('update-status', `Cached news: ${date(news.fetchedAt)}. Tap 'Check for updates' when online.`);
}

async function update() {
  if (busy) return;
  busy = true;
  $('refresh').disabled = true;
  note('update-status', 'Checking feeds…');

  try {
    const result = await refreshFeeds({
      baseline: news,
      feeds: FEEDS,
      request: url => CapacitorHttp.get({url, responseType: 'text', connectTimeout: 12000, readTimeout: 12000})
    });
    await Filesystem.writeFile({path: 'news.json', directory: Directory.Data, encoding: Encoding.UTF8, data: JSON.stringify(result.news)});
    news = result.news;
    drawNews();
    note('update-status', `Updated ${result.updated.length} of ${FEEDS.length} feeds (${date(news.fetchedAt)}).${result.failed.length ? ' Feeds unreachable: ' + result.failed.join(', ') + '. Cached posts retained.' : ''}`);
  } catch (e) {
    note('update-status', `Offline or feed check failed (${e.message || 'Network error'}). Previously saved articles remain available.`);
  } finally {
    busy = false;
    $('refresh').disabled = false;
  }
}

// Event Bindings
for (const key of ['news', 'certs', 'route']) {
  $('tab-' + key).onclick = () => show(key);
}

$('about').onclick = about;
$('refresh').onclick = update;
$('news-search').oninput = drawNews;
$('news-filter').onclick = openNewsFilters;

const bookmarksBtn = $('news-bookmarks');
if (bookmarksBtn) {
  bookmarksBtn.onclick = () => {
    newsFilter.bookmarkedOnly = !newsFilter.bookmarkedOnly;
    drawNews();
  };
}

$('cert-search').oninput = () => { shown = 45; drawCerts(); };
$('cert-filter').onclick = openCertFilters;
$('more').onclick = () => { shown += 45; drawCerts(); };

const clearRouteBtn = $('clear-route');
if (clearRouteBtn) {
  clearRouteBtn.onclick = promptClearRoadmap;
}

if (Capacitor.isNativePlatform()) {
  SystemBars.show().catch(() => {});
  SystemBars.setStyle({style: SystemBarsStyle.Dark}).catch(() => {});
}

loadSaved();
