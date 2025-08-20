// ================================
// File: src/components/BoardView.tsx
// ================================
import React from 'react';
import type { Board, ID, Priority, Task } from '../types';
import { ListColumn } from './ListColumn';
import { Modal, TextField } from './ui';
import {
  createList as apiCreateList,
  updateList as apiUpdateList,
  deleteList as apiDeleteList,
} from '../api/list';
import {
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
} from '../api/task';
import { getBoardsByUser } from '../api/board';
import { normalizeBoards } from '../store/normalizers';
import { useAppStore } from '../store/AppStore';

export function BoardView({
  board,
  lists,
  tasksById,
}: {
  board: Board;
  lists: { id: ID; title: string; taskIds: ID[] }[];
  tasksById: Record<ID, Task>;
}) {
  const { state, dispatch } = useAppStore();
  const [openNew, setOpenNew] = React.useState(false);
  const [title, setTitle] = React.useState('');

  // Re-fetch boards from API and re-normalize entities after mutations
  const refreshEntities = React.useCallback(async () => {
    if (!state.userId) return;
    const boards = await getBoardsByUser(state.userId); // e.g. GET /board/get-boards/:userId
    const entities = normalizeBoards(boards);

    // keep the current board selected if it still exists, else select first
    const keepId = state.selectedBoardId;
    const selectedBoardId =
      keepId && entities.boards[keepId]
        ? keepId
        : Object.keys(entities.boards).map(Number)[0] ?? null;

    dispatch({
      type: 'bootstrap:success',
      payload: {
        userId: state.userId,
        userName: state.userName!,
        entities,
        selectedBoardId,
      },
    });
  }, [state.userId, state.userName, state.selectedBoardId, dispatch]);

  return (
    <div className="flex min-h-[60vh] gap-3 overflow-x-auto pb-3">
      {lists.map((l) => (
        <ListColumn
          key={l.id}
          list={l}
          tasks={l.taskIds.map((id) => tasksById[id]).filter(Boolean)}
          // CREATE TASK -> then re-fetch boards
          onAddTask={async (t, d, p: Priority) => {
            await apiCreateTask(t, d, p, l.id);   // POST /task/create
            await refreshEntities();               // re-fetch from /board/get-boards/:userId
          }}
          // EDIT TASK (local mutate is fine; you can also re-fetch if you want strict server truth)
          onEditTask={async (taskId, patch) => {
            await apiUpdateTask(taskId, patch);    // PUT /task/update/:id
            // optional: await refreshEntities();
            dispatch({ type: 'tasks:update', id: taskId, patch });
          }}
          // DELETE TASK (local + optional re-fetch)
          onDeleteTask={async (taskId) => {
            await apiDeleteTask(taskId);           // DELETE /task/delete/:id
            // optional: await refreshEntities();
            dispatch({ type: 'tasks:delete', listId: l.id, taskId });
          }}
          // RENAME LIST (local + optional re-fetch)
          onRenameList={async (newTitle) => {
            await apiUpdateList(l.id, { title: newTitle }); // PUT /list/update/:id
            // optional: await refreshEntities();
            dispatch({ type: 'lists:rename', id: l.id, title: newTitle });
          }}
          // DELETE LIST (local + optional re-fetch)
          onDeleteList={async () => {
            await apiDeleteList(l.id);             // DELETE /list/delete/:id
            // optional: await refreshEntities();
            dispatch({ type: 'lists:delete', boardId: board.id, listId: l.id });
          }}
        />
      ))}

      {/* Add list card */}
      <div className="flex w-80 min-w-[18rem] max-w-sm flex-col gap-3 rounded-2xl border border-dashed border-gray-300 p-3">
        <button
          onClick={() => setOpenNew(true)}
          className="rounded-xl px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
        >
          + Add list
        </button>
      </div>

      {/* Create list modal */}
      <Modal open={openNew} onClose={() => setOpenNew(false)} title="Add List">
        <div className="grid gap-3">
          <TextField label="Title" value={title} onChange={setTitle} autoFocus />
          <div className="flex justify-end gap-2">
            <button
              className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100"
              onClick={() => setOpenNew(false)}
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black"
              onClick={async () => {
                await apiCreateList(title, board.id); // POST /list/create
                await refreshEntities();               // re-fetch from /board/get-boards/:userId
                setOpenNew(false);
                setTitle('');
              }}
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
