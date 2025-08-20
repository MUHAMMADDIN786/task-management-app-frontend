const API_BASE = import.meta.env.VITE_API_BASE as string;

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} — ${text || 'Request failed'}`);
  }
  // Some DELETEs may return empty
  const ct = res.headers.get('content-type') || '';
  return (ct.includes('application/json') ? res.json() : (undefined as unknown)) as T;
}