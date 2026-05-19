// Storage layer for the AEPC Command Center.
//
// Primary: Vercel KV via /api/data (shared across all operators).
// Fallback: localStorage (per-browser, used only if KV isn't configured —
// which should never happen in production).

const PASSWORD_KEY = 'aepc:password';

function getPassword() {
  try { return sessionStorage.getItem(PASSWORD_KEY); } catch (e) { return null; }
}

async function fetchKV(method, key, value) {
  const password = getPassword();
  if (!password) throw new Error('No password — auth gate not passed');

  const headers = {
    'Content-Type': 'application/json',
    'X-AEPC-Pass': password
  };

  if (method === 'GET') {
    const res = await fetch(`/api/data?key=${encodeURIComponent(key)}`, { headers });
    if (!res.ok) throw new Error(`KV read failed: ${res.status}`);
    const body = await res.json();
    return body.value;
  }

  const res = await fetch('/api/data', {
    method: 'POST',
    headers,
    body: JSON.stringify({ key, value })
  });
  if (!res.ok) throw new Error(`KV write failed: ${res.status}`);
}

export const storage = {
  async get(key) {
    try {
      return await fetchKV('GET', key);
    } catch (err) {
      // Fallback to localStorage in dev or if KV is down
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }
  },

  async set(key, value) {
    try {
      await fetchKV('POST', key, value);
    } catch (err) {
      // Fallback
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) { /* swallow */ }
    }
  }
};
