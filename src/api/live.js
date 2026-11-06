import { client } from './client.js';

/**
 * Live updates — what makes a change made elsewhere show up here without a
 * reload.
 *
 * While the panel is signed in and on screen, GET /live is asked every few
 * seconds. It answers one counter per topic (applications, tickets,
 * notifications, wallet …) covering only what concerns this account. A topic
 * whose counter moved is announced as a `live:change` window event, and
 * useLiveRefresh (hooks/useLiveRefresh.js) has the page on screen fetch again.
 *
 * A poll and not a socket because the API runs on serverless functions, where
 * a connection cannot be held open — see the backend's live.service.js.
 *
 * Hidden tabs do not ask; coming back to the tab asks at once, and the pages
 * refetch on focus as well, so nothing missed while away stays stale.
 */

export const LIVE_EVENT = 'live:change';

const POLL_MS = 4000;

let timer = null;
let running = false;
let inFlight = false;
let last = null;

function announce(topics) {
  if (topics.length) window.dispatchEvent(new CustomEvent(LIVE_EVENT, { detail: { topics } }));
}

async function check() {
  if (!running || inFlight || document.visibilityState !== 'visible') return;

  inFlight = true;
  try {
    const response = await client.get('/live');
    const versions = response.data?.data?.versions ?? {};

    // The first answer is only the baseline — the page has just loaded.
    if (last) {
      const topics = new Set([...Object.keys(versions), ...Object.keys(last)]);
      announce([...topics].filter((topic) => versions[topic] !== last[topic]));
    }
    last = versions;
  } catch {
    // A failed poll is retried on the next tick; the page keeps what it shows.
  } finally {
    inFlight = false;
  }
}

function onVisible() {
  if (document.visibilityState === 'visible') check();
}

/** Called by AuthContext once signed in. Safe to call again. */
export function startLive() {
  if (running) return;

  running = true;
  last = null;
  check();
  timer = setInterval(check, POLL_MS);
  document.addEventListener('visibilitychange', onVisible);
}

/** Called by AuthContext on sign-out, so nothing polls on the sign-in screen. */
export function stopLive() {
  running = false;
  last = null;
  clearInterval(timer);
  timer = null;
  document.removeEventListener('visibilitychange', onVisible);
}
