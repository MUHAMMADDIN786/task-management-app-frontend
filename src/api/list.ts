import { api } from './client';
import type { ID } from '../types';

export async function createList(title: string, boardId: ID) {
  return api(`/list/create`, { method: 'POST', body: JSON.stringify({ title, boardId }) });
}

// NOTE: Your message shows list update as '/board/update/:id'.
// Assuming this is a typo, we'll use '/list/update/:id'. If your API
// truly uses '/board/update/:id', change the path here.
export async function updateList(listId: ID, body: Record<string, unknown>) {
  return api(`/list/update/${listId}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteList(listId: ID) {
  return api<void>(`/list/delete/${listId}`, { method: 'DELETE' });
}
