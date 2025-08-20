import { api } from './client';
import type { ApiBoard, ID } from '../types';

export async function getBoardsByUser(userId: ID): Promise<ApiBoard[]> {
  return api(`/board/get-boards/${userId}`);
}

export async function updateBoard(boardId: ID, body: Record<string, unknown>) {
  return api(`/board/update/${boardId}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteBoard(boardId: ID) {
  return api<void>(`/board/delete/${boardId}`, { method: 'DELETE' });
}
// add this function
export async function createBoard(title: string, userId: ID) {
  return api(`/board/create`, {
    method: 'POST',
    body: JSON.stringify({ title, userId }),
  });
}
