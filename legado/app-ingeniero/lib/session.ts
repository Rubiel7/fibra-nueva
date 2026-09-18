// Client-side session ID management
// Uses localStorage to persist a UUID per browser

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('fibras_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('fibras_session_id', sid);
  }
  return sid;
}
