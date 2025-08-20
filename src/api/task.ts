import { api } from './client';
import type { ID, Priority } from '../types';

export async function createTask(title: string, description: string, priority: Priority, listId: ID) {
  return api(`/task/create`, { method: 'POST', body: JSON.stringify({ title, description, priority, listId }) });
}

// Same NOTE as lists; assuming '/task/update/:id'
export async function updateTask(taskId: ID, body: Record<string, unknown>) {
  return api(`/task/update/${taskId}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteTask(taskId: ID) {
  return api<void>(`/task/delete/${taskId}`, { method: 'DELETE' });
}