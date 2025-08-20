import { api } from './client';
import type { ID } from '../types';

export async function createUser(name: string): Promise<{ id: ID; name: string }>{
  // According to your cURL, no body shape was shown; we'll send { name }
  return api('/user/create', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}