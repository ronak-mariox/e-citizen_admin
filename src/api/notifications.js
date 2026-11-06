import { client } from './client.js';

/**
 * The signed-in admin's own notifications (backend/src/routes/notification.routes.js).
 *
 * The same endpoint every role reads from — an admin's rows are scoped to
 * their own account by the token, exactly like an agent's or a citizen's.
 * Returns `{ notifications, unread, pagination }`; `unread` is counted per
 * type over everything, not just the current page, so a filter chip's count
 * does not fall every time the list scrolls.
 */
export async function listMyNotifications({ page, limit, type } = {}) {
  const response = await client.get('/notifications', {
    params: { page, limit, type: type === 'all' ? undefined : type },
  });

  return response.data.data;
}

/** One, or — with no id — every unread notification of this admin's.
    Returns the fresh unread counts, which is all a caller needs to redraw. */
export async function markNotificationsRead(notificationId) {
  const path = notificationId ? `/notifications/${notificationId}/read` : '/notifications/read';
  const response = await client.patch(path);

  return response.data.data.unread;
}

export default { listMyNotifications, markNotificationsRead };
