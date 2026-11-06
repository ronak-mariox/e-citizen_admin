import { useEffect, useRef } from 'react';

import { LIVE_EVENT } from '../api/live.js';

/* Topics that change on almost every action (the audit trail records each
   sign-in) and that only the pages built around them need to follow. */
const QUIET_TOPICS = ['audit'];

const SETTLE_MS = 300;

/**
 * Refetches a page's data when something it shows changes elsewhere.
 *
 *   useLiveRefresh(reload);                          // any change that concerns me
 *   useLiveRefresh(reload, ['applications']);        // only these topics
 *
 * `reload` is called — never more than once per burst, since one action often
 * writes several records — when api/live.js announces a matching topic, and
 * also when the tab or window comes back into focus.
 *
 * `reload` should refetch quietly: keep showing the current rows while the new
 * ones load, rather than swapping the page for a spinner every few seconds.
 */
export function useLiveRefresh(reload, topics) {
  const reloadRef = useRef(reload);
  const topicsKey = topics ? topics.join(',') : '';

  useEffect(() => {
    reloadRef.current = reload;
  });

  useEffect(() => {
    const wanted = topicsKey ? topicsKey.split(',') : null;
    let timer = null;

    const fire = () => {
      clearTimeout(timer);
      timer = setTimeout(() => reloadRef.current?.(), SETTLE_MS);
    };

    const onChange = (event) => {
      const changed = event.detail?.topics ?? [];
      const matches = wanted
        ? changed.some((topic) => wanted.includes(topic))
        : changed.some((topic) => !QUIET_TOPICS.includes(topic));
      if (matches) fire();
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') fire();
    };

    window.addEventListener(LIVE_EVENT, onChange);
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(LIVE_EVENT, onChange);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [topicsKey]);
}

export default useLiveRefresh;
