import type { AppState, Board, Entities, ID, List, Task } from '../types';

export type Action =
  | { type: 'bootstrap:start' }
  | { type: 'bootstrap:success'; payload: { userId: ID; userName: string; entities: Entities; selectedBoardId: ID | null } }
  | { type: 'bootstrap:error'; error: string }
  | { type: 'set:selectedBoard'; id: ID }
  | { type: 'sync:setEntities'; entities: Entities }
  | { type: 'boards:rename'; id: ID; title: string }
  | { type: 'lists:rename'; id: ID; title: string }
  | { type: 'tasks:update'; id: ID; patch: Partial<Task> }
  | { type: 'tasks:delete'; listId: ID; taskId: ID }
  | { type: 'lists:delete'; boardId: ID; listId: ID }
  | { type: 'boards:delete'; id: ID };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'bootstrap:start':
      return { ...state, loading: true, error: null };
    case 'bootstrap:success':
      return { ...state, loading: false, error: null, userId: action.payload.userId, userName: action.payload.userName, entities: action.payload.entities, selectedBoardId: action.payload.selectedBoardId };
    case 'bootstrap:error':
      return { ...state, loading: false, error: action.error };

    case 'set:selectedBoard':
      return { ...state, selectedBoardId: action.id };

    case 'sync:setEntities':
      return { ...state, entities: action.entities };

    case 'boards:rename': {
      const b = state.entities.boards[action.id];
      if (!b) return state;
      const boards = { ...state.entities.boards, [action.id]: { ...b, title: action.title } as Board };
      return { ...state, entities: { ...state.entities, boards } };
    }

    case 'lists:rename': {
      const l = state.entities.lists[action.id];
      if (!l) return state;
      const lists = { ...state.entities.lists, [action.id]: { ...l, title: action.title } as List };
      return { ...state, entities: { ...state.entities, lists } };
    }

    case 'tasks:update': {
      const t = state.entities.tasks[action.id];
      if (!t) return state;
      const tasks = { ...state.entities.tasks, [action.id]: { ...t, ...action.patch } as Task };
      return { ...state, entities: { ...state.entities, tasks } };
    }

    case 'tasks:delete': {
      const list = state.entities.lists[action.listId];
      if (!list) return state;
      const tasks = { ...state.entities.tasks };
      delete tasks[action.taskId];
      const lists = { ...state.entities.lists, [list.id]: { ...list, taskIds: list.taskIds.filter(id => id !== action.taskId) } };
      return { ...state, entities: { ...state.entities, lists, tasks } };
    }

    case 'lists:delete': {
      const board = state.entities.boards[action.boardId];
      const list = state.entities.lists[action.listId];
      if (!board || !list) return state;
      const lists = { ...state.entities.lists };
      for (const tid of list.taskIds) delete state.entities.tasks[tid];
      delete lists[list.id];
      const boards = { ...state.entities.boards, [board.id]: { ...board, listIds: board.listIds.filter(id => id !== list.id) } };
      return { ...state, entities: { ...state.entities, boards, lists, tasks: { ...state.entities.tasks } } };
    }

    case 'boards:delete': {
      const boards = { ...state.entities.boards };
      const board = boards[action.id];
      if (!board) return state;
      delete boards[action.id];
      const lists = { ...state.entities.lists };
      const tasks = { ...state.entities.tasks };
      for (const lid of board.listIds) {
        const l = lists[lid];
        if (!l) continue;
        for (const tid of l.taskIds) delete tasks[tid];
        delete lists[lid];
      }
      const nextId = Object.keys(boards).map(Number)[0] ?? null;
      return { ...state, selectedBoardId: nextId, entities: { boards, lists, tasks } };
    }

    default:
      return state;
  }
}

export const initialState: AppState = {
  userId: null,
  userName: null,
  loading: false,
  error: null,
  selectedBoardId: null,
  entities: { boards: {}, lists: {}, tasks: {} },
};
