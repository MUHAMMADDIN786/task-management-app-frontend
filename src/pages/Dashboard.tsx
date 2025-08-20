// src/pages/Dashboard.tsx
import React, { useEffect } from 'react';
import { useAppStore } from '../store/AppStore';
import { getBoardsByUser, createBoard } from '../api/board';
import { normalizeBoards } from '../store/normalizers';
import { BoardSelector } from '../components/BoardSelector';
import { BoardView } from '../components/BoardView';
import { Modal, TextField } from '../components/ui';

export default function Dashboard() {
  const { state, dispatch } = useAppStore();
  const userId = state.userId!;
  const [loadingOnce, setLoadingOnce] = React.useState(false);

  // Create-board modal UI state
  const [openCreate, setOpenCreate] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('My Board');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // load user boards
  useEffect(() => {
    (async () => {
      if (!userId) return;
      dispatch({ type: 'bootstrap:start' });
      try {
        const boards = await getBoardsByUser(userId);
        const entities = normalizeBoards(boards);
        const firstBoardId = Object.keys(entities.boards).map(Number)[0] ?? null;
        dispatch({
          type: 'bootstrap:success',
          payload: {
            userId,
            userName: state.userName!,
            entities,
            selectedBoardId: firstBoardId,
          },
        });
      } catch (e: any) {
        dispatch({ type: 'bootstrap:error', error: e.message || 'Failed to load boards' });
      } finally {
        setLoadingOnce(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function refreshEntitiesAndKeepSelection(preferBoardId?: number | null) {
    const boards = await getBoardsByUser(userId);
    const entities = normalizeBoards(boards);

    // keep current selection, or prefer the provided id (e.g., created board), else first
    let selectedBoardId = state.selectedBoardId;
    if (preferBoardId && entities.boards[preferBoardId]) {
      selectedBoardId = preferBoardId;
    } else if (selectedBoardId && !entities.boards[selectedBoardId]) {
      selectedBoardId = Object.keys(entities.boards).map(Number)[0] ?? null;
    }

    dispatch({
      type: 'bootstrap:success',
      payload: {
        userId,
        userName: state.userName!,
        entities,
        selectedBoardId,
      },
    });
  }

  async function onCreateBoard() {
    if (!newTitle.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createBoard(newTitle.trim(), userId); // POST /board/create
      const createdId = (created as any)?.id as number | undefined;
      await refreshEntitiesAndKeepSelection(createdId ?? null);   // re-fetch GET /board/get-boards/:userId
      setOpenCreate(false);
      setNewTitle('My Board');
    } catch (e: any) {
      setError(e.message || 'Failed to create board');
    } finally {
      setSubmitting(false);
    }
  }

  const boards = Object.values(state.entities.boards);
  const selected = state.selectedBoardId ? state.entities.boards[state.selectedBoardId] : null;
  const lists = selected ? selected.listIds.map((id) => state.entities.lists[id]).filter(Boolean) : [];
  const showEmpty = loadingOnce && boards.length === 0;

  return (
    <div className="mx-auto max-w-[1400px] p-4">
      {/* Header */}
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Task Boards</h1>

        <div className="ml-auto flex items-center gap-2">
          <BoardSelector
            boards={boards}
            selectedId={state.selectedBoardId}
            onSelect={(id) => dispatch({ type: 'set:selectedBoard', id })}
          />
          <button
            className="rounded-xl bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black"
            onClick={() => setOpenCreate(true)}
          >
            + Create board
          </button>
        </div>
      </header>

      {/* Content */}
      {showEmpty ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">
          You don’t have any boards yet. Click <span className="font-medium">“Create board”</span> to add one.
        </div>
      ) : selected ? (
        <BoardView board={selected} lists={lists} tasksById={state.entities.tasks} />
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">
          {state.loading ? 'Loading boards…' : 'No board selected'}
        </div>
      )}

      {state.error && <p className="mt-4 text-sm text-red-600">{state.error}</p>}

      {/* Create Board Modal */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Create Board">
        <div className="grid gap-3">
          <TextField
            label="Title"
            value={newTitle}
            onChange={setNewTitle}
            autoFocus
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100"
              onClick={() => setOpenCreate(false)}
            >
              Cancel
            </button>
            <button
              disabled={submitting || !newTitle.trim()}
              className="rounded-xl bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black disabled:opacity-60"
              onClick={onCreateBoard}
            >
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-500">
        <p>
          Data is loaded from your API • <span className="mx-1">GET /board/get-boards/:userId</span>
        </p>
      </footer>
    </div>
  );
}
