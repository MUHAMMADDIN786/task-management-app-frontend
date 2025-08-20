import type { ApiBoard, Entities } from '../types';

export function normalizeBoards(apiBoards: ApiBoard[]): Entities {
  const entities: Entities = { boards: {}, lists: {}, tasks: {} };
  for (const b of apiBoards) {
    const listIds: number[] = [];
    for (const l of b.lists) {
      listIds.push(l.id);
      const taskIds: number[] = [];
      for (const t of l.tasks) {
        taskIds.push(t.id);
        entities.tasks[t.id] = {
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          priority: t.priority,
          createdAt: new Date(t.createdAt).getTime(),
        };
      }
      entities.lists[l.id] = { id: l.id, title: l.title, taskIds };
    }
    entities.boards[b.id] = { id: b.id, title: b.title, listIds };
  }
  return entities;
}
