import React, {useCallback, useEffect, useMemo, useReducer, useState} from "react";

/**
 * Trello-like UI — Frontend-only (React + Tailwind + TypeScript)
 * - Boards → Lists → Tasks (display & CRUD)
 * - No backend: state persisted to localStorage
 * - Componentized, memoized, responsive
 * - Zero external deps (works in Vite React + Tailwind template)
 *
 * Files: Single-file demo component you can drop into src/App.tsx
 * Tailwind: ensure you have base styles set up from Vite+Tailwind template.
 */

// ---------- Types ----------
export type ID = string;
export type Priority = "low" | "medium" | "high";

export interface Task {
  id: ID;
  title: string;
  description?: string;
  priority: Priority;
  createdAt: number;
}

export interface List {
  id: ID;
  title: string;
  taskIds: ID[]; // order of tasks
}

export interface Board {
  id: ID;
  title: string;
  listIds: ID[]; // order of lists
}

export interface Entities {
  tasks: Record<ID, Task>;
  lists: Record<ID, List>;
  boards: Record<ID, Board>;
}

export interface AppState {
  entities: Entities;
  selectedBoardId: ID | null;
}

// ---------- Utilities ----------
const uid = () => Math.random().toString(36).slice(2, 10);

const now = () => Date.now();

const STORAGE_KEY = "trelloish-ui-state-v1";

const save = (state: AppState) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const load = (): AppState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ---------- Initial State (seed with one board/list/task) ----------
const defaultState = (): AppState => {
  const task1: Task = { id: uid(), title: "Plan project scope", description: "Define MVP, milestones.", priority: "high", createdAt: now() };
  const task2: Task = { id: uid(), title: "Set up Vite + Tailwind", priority: "medium", createdAt: now() };
  const list1: List = { id: uid(), title: "Todo", taskIds: [task1.id, task2.id] };
  const list2: List = { id: uid(), title: "In Progress", taskIds: [] };
  const list3: List = { id: uid(), title: "Done", taskIds: [] };
  const board1: Board = { id: uid(), title: "Demo Board", listIds: [list1.id, list2.id, list3.id] };

  return {
    entities: {
      tasks: { [task1.id]: task1, [task2.id]: task2 },
      lists: { [list1.id]: list1, [list2.id]: list2, [list3.id]: list3 },
      boards: { [board1.id]: board1 },
    },
    selectedBoardId: board1.id,
  };
};

// ---------- Actions ----------

type Action =
  | { type: "hydrate"; payload: AppState }
  | { type: "selectBoard"; id: ID }
  | { type: "addBoard"; title: string }
  | { type: "renameBoard"; id: ID; title: string }
  | { type: "deleteBoard"; id: ID }
  | { type: "addList"; boardId: ID; title: string }
  | { type: "renameList"; listId: ID; title: string }
  | { type: "deleteList"; boardId: ID; listId: ID }
  | { type: "addTask"; listId: ID; title: string; description?: string; priority?: Priority }
  | { type: "updateTask"; taskId: ID; patch: Partial<Omit<Task, "id" | "createdAt">> }
  | { type: "deleteTask"; listId: ID; taskId: ID }
  | { type: "moveTask"; sourceListId: ID; targetListId: ID; taskId: ID; targetIndex?: number }
  | { type: "reorderList"; boardId: ID; sourceIndex: number; targetIndex: number }
  | { type: "reorderTaskWithinList"; listId: ID; sourceIndex: number; targetIndex: number };

// ---------- Reducer ----------
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return action.payload;

    case "selectBoard":
      return { ...state, selectedBoardId: action.id };

    case "addBoard": {
      const id = uid();
      const board: Board = { id, title: action.title.trim() || "Untitled Board", listIds: [] };
      return {
        ...state,
        entities: { ...state.entities, boards: { ...state.entities.boards, [id]: board } },
        selectedBoardId: id,
      };
    }

    case "renameBoard": {
      const b = state.entities.boards[action.id];
      if (!b) return state;
      const updated: Board = { ...b, title: action.title.trim() || b.title };
      return { ...state, entities: { ...state.entities, boards: { ...state.entities.boards, [b.id]: updated } } };
    }

    case "deleteBoard": {
      const { [action.id]: _, ...restBoards } = state.entities.boards;
      // Also remove its lists (and tasks inside) — simple cleanup
      const board = state.entities.boards[action.id];
      if (!board) return state;
      const newLists = { ...state.entities.lists };
      const newTasks = { ...state.entities.tasks };
      for (const listId of board.listIds) {
        const list = state.entities.lists[listId];
        if (!list) continue;
        for (const taskId of list.taskIds) delete newTasks[taskId];
        delete newLists[listId];
      }
      const nextBoardId = Object.keys(restBoards)[0] ?? null;
      return {
        selectedBoardId: nextBoardId,
        entities: { tasks: newTasks, lists: newLists, boards: restBoards },
      };
    }

    case "addList": {
      const board = state.entities.boards[action.boardId];
      if (!board) return state;
      const id = uid();
      const list: List = { id, title: action.title.trim() || "New List", taskIds: [] };
      return {
        ...state,
        entities: {
          ...state.entities,
          lists: { ...state.entities.lists, [id]: list },
          boards: { ...state.entities.boards, [board.id]: { ...board, listIds: [...board.listIds, id] } },
        },
      };
    }

    case "renameList": {
      const list = state.entities.lists[action.listId];
      if (!list) return state;
      const updated: List = { ...list, title: action.title.trim() || list.title };
      return { ...state, entities: { ...state.entities, lists: { ...state.entities.lists, [list.id]: updated } } };
    }

    case "deleteList": {
      const board = state.entities.boards[action.boardId];
      const list = state.entities.lists[action.listId];
      if (!board || !list) return state;
      const newBoards: Record<ID, Board> = { ...state.entities.boards, [board.id]: { ...board, listIds: board.listIds.filter(id => id !== list.id) } };
      const newLists = { ...state.entities.lists };
      const newTasks = { ...state.entities.tasks };
      for (const taskId of list.taskIds) delete newTasks[taskId];
      delete newLists[list.id];
      return { ...state, entities: { tasks: newTasks, lists: newLists, boards: newBoards } };
    }

    case "addTask": {
      const list = state.entities.lists[action.listId];
      if (!list) return state;
      const id = uid();
      const task: Task = {
        id,
        title: action.title.trim() || "New Task",
        description: (action.description ?? "").trim() || undefined,
        priority: action.priority ?? "low",
        createdAt: now(),
      };
      return {
        ...state,
        entities: {
          ...state.entities,
          tasks: { ...state.entities.tasks, [id]: task },
          lists: { ...state.entities.lists, [list.id]: { ...list, taskIds: [...list.taskIds, id] } },
        },
      };
    }

    case "updateTask": {
      const task = state.entities.tasks[action.taskId];
      if (!task) return state;
      const updated: Task = { ...task, ...action.patch } as Task;
      return { ...state, entities: { ...state.entities, tasks: { ...state.entities.tasks, [task.id]: updated } } };
    }

    case "deleteTask": {
      const list = state.entities.lists[action.listId];
      if (!list) return state;
      const newTasks = { ...state.entities.tasks };
      delete newTasks[action.taskId];
      const newList = { ...list, taskIds: list.taskIds.filter(id => id !== action.taskId) };
      return { ...state, entities: { ...state.entities, tasks: newTasks, lists: { ...state.entities.lists, [list.id]: newList } } };
    }

    case "moveTask": {
      const src = state.entities.lists[action.sourceListId];
      const tgt = state.entities.lists[action.targetListId];
      if (!src || !tgt) return state;
      if (!src.taskIds.includes(action.taskId)) return state;
      const removed = src.taskIds.filter(id => id !== action.taskId);
      const targetIndex = action.targetIndex ?? tgt.taskIds.length;
      const inserted = [...tgt.taskIds.slice(0, targetIndex), action.taskId, ...tgt.taskIds.slice(targetIndex)];
      return {
        ...state,
        entities: {
          ...state.entities,
          lists: {
            ...state.entities.lists,
            [src.id]: { ...src, taskIds: removed },
            [tgt.id]: { ...tgt, taskIds: inserted },
          },
        },
      };
    }

    case "reorderList": {
      const board = state.entities.boards[action.boardId];
      if (!board) return state;
      const listIds = [...board.listIds];
      const [moved] = listIds.splice(action.sourceIndex, 1);
      listIds.splice(action.targetIndex, 0, moved);
      return { ...state, entities: { ...state.entities, boards: { ...state.entities.boards, [board.id]: { ...board, listIds } } } };
    }

    case "reorderTaskWithinList": {
      const list = state.entities.lists[action.listId];
      if (!list) return state;
      const ids = [...list.taskIds];
      const [moved] = ids.splice(action.sourceIndex, 1);
      ids.splice(action.targetIndex, 0, moved);
      return { ...state, entities: { ...state.entities, lists: { ...state.entities.lists, [list.id]: { ...list, taskIds: ids } } } };
    }

    default:
      return state;
  }
}

// ---------- Hooks ----------
function usePersistentReducer() {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as AppState, () => load() ?? defaultState());
  useEffect(() => { save(state); }, [state]);
  return { state, dispatch } as const;
}

// ---------- UI Primitives ----------
const IconButton = React.memo(function IconButton({
  title,
  onClick,
  children,
  className = "",
}: React.PropsWithChildren<{ title: string; onClick?: () => void; className?: string }>) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={"inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100 active:scale-[.98] transition " + className}
    >
      {children}
    </button>
  );
});

const Badge = React.memo(function Badge({ children }: React.PropsWithChildren) {
  return <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{children}</span>;
});

function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onMouseDown={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl" onMouseDown={e => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="rounded-md p-2 hover:bg-gray-100" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Confirm({ open, onCancel, onConfirm, title, message }: { open: boolean; onCancel: () => void; onConfirm: () => void; title: string; message: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onMouseDown={onCancel}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onMouseDown={e => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100">Cancel</button>
          <button onClick={onConfirm} className="rounded-xl bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Forms ----------
function TextField({ label, value, onChange, placeholder, autoFocus }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-gray-600">{label}</span>
      <input
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-gray-600">{label}</span>
      <textarea
        className="min-h-[90px] rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-gray-600">{label}</span>
      <select
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

// ---------- Feature Components ----------
const BoardSelector: React.FC<{
  boards: Board[];
  selectedId: ID | null;
  onSelect: (id: ID) => void;
  onAdd: (title: string) => void;
  onRename: (id: ID, title: string) => void;
  onDelete: (id: ID) => void;
}> = ({ boards, selectedId, onSelect, onAdd, onRename, onDelete }) => {
  const [openNew, setOpenNew] = useState(false);
  const [title, setTitle] = useState("");
  const [renameId, setRenameId] = useState<ID | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [confirmId, setConfirmId] = useState<ID | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-2">
        {boards.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            className={`rounded-2xl px-3 py-1.5 text-sm shadow-sm transition ${selectedId === b.id ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"}`}
          >
            {b.title}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <IconButton title="New board" onClick={() => { setOpenNew(true); setTitle(""); }}>➕ New</IconButton>
        {selectedId && (
          <>
            <IconButton title="Rename board" onClick={() => { setRenameId(selectedId); setRenameTitle(boards.find(b=>b.id===selectedId)?.title ?? ""); }}>✏️ Rename</IconButton>
            <IconButton title="Delete board" className="text-red-600" onClick={() => setConfirmId(selectedId)}>🗑️ Delete</IconButton>
          </>
        )}
      </div>

      {/* Create */}
      <Modal open={openNew} onClose={() => setOpenNew(false)} title="Create Board">
        <div className="grid gap-3">
          <TextField label="Title" value={title} onChange={setTitle} autoFocus />
          <div className="flex justify-end gap-2">
            <button className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100" onClick={() => setOpenNew(false)}>Cancel</button>
            <button className="rounded-xl bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black" onClick={() => { onAdd(title); setOpenNew(false); }}>Create</button>
          </div>
        </div>
      </Modal>

      {/* Rename */}
      <Modal open={!!renameId} onClose={() => setRenameId(null)} title="Rename Board">
        <div className="grid gap-3">
          <TextField label="Title" value={renameTitle} onChange={setRenameTitle} autoFocus />
          <div className="flex justify-end gap-2">
            <button className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100" onClick={() => setRenameId(null)}>Cancel</button>
            <button className="rounded-xl bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black" onClick={() => { if (renameId) onRename(renameId, renameTitle); setRenameId(null); }}>Save</button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <Confirm open={!!confirmId} onCancel={() => setConfirmId(null)} onConfirm={() => { if (confirmId) onDelete(confirmId); setConfirmId(null); }} title="Delete board?" message="This will remove the board, its lists and tasks." />
    </div>
  );
};

const TaskCard = React.memo(function TaskCard({ task, onEdit, onDelete }: { task: Task; onEdit: (task: Task) => void; onDelete: () => void }) {
  const prioColor = task.priority === "high" ? "bg-red-500" : task.priority === "medium" ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-medium">{task.title}</h4>
        <span className={`ml-2 inline-block h-2 w-2 rounded-full ${prioColor}`} />
      </div>
      {task.description && (
        <p className="mb-3 line-clamp-3 whitespace-pre-wrap text-sm text-gray-600">{task.description}</p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{new Date(task.createdAt).toLocaleDateString()}</span>
        <div className="invisible flex gap-1 group-hover:visible">
          <button onClick={() => onEdit(task)} className="rounded-md px-2 py-1 hover:bg-gray-100">Edit</button>
          <button onClick={onDelete} className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50">Delete</button>
        </div>
      </div>
    </div>
  );
});

const ListColumn: React.FC<{
  list: List;
  tasks: Task[];
  onAddTask: (title: string, description: string, priority: Priority) => void;
  onEditTask: (taskId: ID, patch: Partial<Omit<Task, "id" | "createdAt">>) => void;
  onDeleteTask: (taskId: ID) => void;
  onRenameList: (title: string) => void;
  onDeleteList: () => void;
}> = ({ list, tasks, onAddTask, onEditTask, onDeleteTask, onRenameList, onDeleteList }) => {
  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [confirmList, setConfirmList] = useState(false);

  // new task fields
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tPrio, setTPrio] = useState<Priority>("low");

  // list rename inline
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);

  useEffect(() => setTitle(list.title), [list.title]);

  return (
    <div className="flex w-80 min-w-[18rem] max-w-sm flex-col gap-3 rounded-2xl bg-gray-50 p-3 shadow-sm">
      <div className="flex items-center gap-2">
        {editingTitle ? (
          <input
            className="w-full rounded-xl border border-gray-200 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-gray-300"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { setEditingTitle(false); if (title.trim()) onRenameList(title); }}
            onKeyDown={(e) => { if (e.key === "Enter") { (e.currentTarget as HTMLInputElement).blur(); }}}
            autoFocus
          />
        ) : (
          <h3 className="flex-1 text-sm font-semibold" onDoubleClick={() => setEditingTitle(true)}>{list.title}</h3>
        )}
        <IconButton title="Delete list" className="text-red-600" onClick={() => setConfirmList(true)}>🗑️</IconButton>
      </div>

      <button onClick={() => setOpenNew(true)} className="rounded-xl border border-dashed border-gray-300 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100">+ Add task</button>

      <div className="grid gap-2">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onEdit={(task) => setOpenEdit({ open: true, task })} onDelete={() => onDeleteTask(t.id)} />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-3 text-center text-sm text-gray-500">No tasks</div>
        )}
      </div>

      {/* New Task */}
      <Modal open={openNew} onClose={() => setOpenNew(false)} title="Add Task">
        <div className="grid gap-3">
          <TextField label="Title" value={tTitle} onChange={setTTitle} autoFocus />
          <TextArea label="Description" value={tDesc} onChange={setTDesc} />
          <Select label="Priority" value={tPrio} onChange={(v)=>setTPrio(v as Priority)} options={[{value:"low",label:"Low"},{value:"medium",label:"Medium"},{value:"high",label:"High"}]} />
          <div className="flex justify-end gap-2">
            <button className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100" onClick={() => setOpenNew(false)}>Cancel</button>
            <button className="rounded-xl bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black" onClick={() => { onAddTask(tTitle, tDesc, tPrio); setTTitle(""); setTDesc(""); setTPrio("low"); setOpenNew(false); }}>Create</button>
          </div>
        </div>
      </Modal>

      {/* Edit Task */}
      <Modal open={openEdit.open} onClose={() => setOpenEdit({ open: false, task: null })} title="Edit Task">
        {openEdit.task && (
          <EditTaskForm
            task={openEdit.task}
            onCancel={() => setOpenEdit({ open: false, task: null })}
            onSave={(patch) => { onEditTask(openEdit.task!.id, patch); setOpenEdit({ open: false, task: null }); }}
          />
        )}
      </Modal>

      {/* Delete list confirm */}
      <Confirm open={confirmList} onCancel={() => setConfirmList(false)} onConfirm={() => { setConfirmList(false); onDeleteList(); }} title="Delete list?" message="All tasks in this list will be deleted." />
    </div>
  );
};

function EditTaskForm({ task, onSave, onCancel }: { task: Task; onSave: (patch: Partial<Omit<Task, "id" | "createdAt">>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description ?? "");
  const [prio, setPrio] = useState<Priority>(task.priority);

  return (
    <div className="grid gap-3">
      <TextField label="Title" value={title} onChange={setTitle} autoFocus />
      <TextArea label="Description" value={desc} onChange={setDesc} />
      <Select label="Priority" value={prio} onChange={(v)=>setPrio(v as Priority)} options={[{value:"low",label:"Low"},{value:"medium",label:"Medium"},{value:"high",label:"High"}]} />
      <div className="flex justify-between">
        <Badge>Created: {new Date(task.createdAt).toLocaleString()}</Badge>
        <div className="flex gap-2">
          <button onClick={onCancel} className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100">Cancel</button>
          <button onClick={() => onSave({ title, description: desc || undefined, priority: prio })} className="rounded-xl bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black">Save</button>
        </div>
      </div>
    </div>
  );
}

const BoardView: React.FC<{
  board: Board;
  lists: List[];
  tasksById: Record<ID, Task>;
  onAddList: (title: string) => void;
  onRenameList: (listId: ID, title: string) => void;
  onDeleteList: (listId: ID) => void;
  onAddTask: (listId: ID, title: string, description: string, priority: Priority) => void;
  onEditTask: (listId: ID, taskId: ID, patch: Partial<Omit<Task, "id" | "createdAt">>) => void;
  onDeleteTask: (listId: ID, taskId: ID) => void;
}> = ({ board, lists, tasksById, onAddList, onRenameList, onDeleteList, onAddTask, onEditTask, onDeleteTask }) => {
  const [openNew, setOpenNew] = useState(false);
  const [title, setTitle] = useState("");

  return (
    <div className="flex min-h-[60vh] gap-3 overflow-x-auto pb-3">
      {lists.map((l) => (
        <ListColumn
          key={l.id}
          list={l}
          tasks={l.taskIds.map(id => tasksById[id]).filter(Boolean)}
          onAddTask={(t, d, p) => onAddTask(l.id, t, d, p)}
          onEditTask={(taskId, patch) => onEditTask(l.id, taskId, patch)}
          onDeleteTask={(taskId) => onDeleteTask(l.id, taskId)}
          onRenameList={(newTitle) => onRenameList(l.id, newTitle)}
          onDeleteList={() => onDeleteList(l.id)}
        />
      ))}

      {/* Add list card */}
      <div className="flex w-80 min-w-[18rem] max-w-sm flex-col gap-3 rounded-2xl border border-dashed border-gray-300 p-3">
        <button onClick={() => setOpenNew(true)} className="rounded-xl px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100">+ Add list</button>
      </div>

      <Modal open={openNew} onClose={() => setOpenNew(false)} title="Add List">
        <div className="grid gap-3">
          <TextField label="Title" value={title} onChange={setTitle} autoFocus />
          <div className="flex justify-end gap-2">
            <button className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100" onClick={() => setOpenNew(false)}>Cancel</button>
            <button className="rounded-xl bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black" onClick={() => { onAddList(title); setTitle(""); setOpenNew(false); }}>Create</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ---------- Root Component ----------
export default function App() {
  const { state, dispatch } = usePersistentReducer();

  const boards = useMemo(() => Object.values(state.entities.boards), [state.entities.boards]);
  const selectedBoard = state.selectedBoardId ? state.entities.boards[state.selectedBoardId] : null;
  const listsForBoard = useMemo(() => selectedBoard ? selectedBoard.listIds.map(id => state.entities.lists[id]).filter(Boolean) : [], [selectedBoard, state.entities.lists]);

  const tasksById = state.entities.tasks;

  // Board actions
  const selectBoard = useCallback((id: ID) => dispatch({ type: "selectBoard", id }), [dispatch]);
  const addBoard = useCallback((title: string) => dispatch({ type: "addBoard", title }), [dispatch]);
  const renameBoard = useCallback((id: ID, title: string) => dispatch({ type: "renameBoard", id, title }), [dispatch]);
  const deleteBoard = useCallback((id: ID) => dispatch({ type: "deleteBoard", id }), [dispatch]);

  // List actions
  const addList = useCallback((title: string) => { if (!selectedBoard) return; dispatch({ type: "addList", boardId: selectedBoard.id, title }); }, [dispatch, selectedBoard]);
  const renameList = useCallback((listId: ID, title: string) => dispatch({ type: "renameList", listId, title }), [dispatch]);
  const deleteList = useCallback((listId: ID) => { if (!selectedBoard) return; dispatch({ type: "deleteList", boardId: selectedBoard.id, listId }); }, [dispatch, selectedBoard]);

  // Task actions
  const addTask = useCallback((listId: ID, title: string, description: string, priority: Priority) => dispatch({ type: "addTask", listId, title, description, priority }), [dispatch]);
  const editTask = useCallback((listId: ID, taskId: ID, patch: Partial<Omit<Task, "id" | "createdAt">>) => dispatch({ type: "updateTask", taskId, patch }), [dispatch]);
  const deleteTask = useCallback((listId: ID, taskId: ID) => dispatch({ type: "deleteTask", listId, taskId }), [dispatch]);

  // Page-level rename
  const [editingBoardTitle, setEditingBoardTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState(selectedBoard?.title ?? "");
  useEffect(() => setBoardTitle(selectedBoard?.title ?? ""), [selectedBoard?.title]);

  return (
    <div className="mx-auto max-w-[1400px] p-4">
      {/* Header */}
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Task Boards</h1>
        <div className="ml-auto w-full sm:w-auto">
          <BoardSelector
            boards={boards}
            selectedId={state.selectedBoardId}
            onSelect={selectBoard}
            onAdd={addBoard}
            onRename={renameBoard}
            onDelete={deleteBoard}
          />
        </div>
      </header>

      {/* Current Board Title */}
      {selectedBoard ? (
        <div className="mb-3 flex items-center gap-3">
          {editingBoardTitle ? (
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-lg font-semibold outline-none focus:ring-2 focus:ring-gray-300"
              value={boardTitle}
              onChange={(e)=>setBoardTitle(e.target.value)}
              onBlur={() => { setEditingBoardTitle(false); if (boardTitle.trim()) renameBoard(selectedBoard.id, boardTitle); }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); }}
              autoFocus
            />
          ) : (
            <h2 className="text-lg font-semibold" onDoubleClick={() => setEditingBoardTitle(true)}>{selectedBoard.title}</h2>
          )}
          <Badge>{listsForBoard.length} list{listsForBoard.length !== 1 ? "s" : ""}</Badge>
          <Badge>{Object.values(tasksById).filter(t => listsForBoard.some(l => l.taskIds.includes(t.id))).length} tasks</Badge>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">Create a board to get started</div>
      )}

      {/* Board View */}
      {selectedBoard && (
        <BoardView
          board={selectedBoard}
          lists={listsForBoard}
          tasksById={tasksById}
          onAddList={addList}
          onRenameList={renameList}
          onDeleteList={deleteList}
          onAddTask={addTask}
          onEditTask={editTask}
          onDeleteTask={deleteTask}
        />
      )}

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-500">
        <p>Double–click list or board titles to rename • Data persists in your browser • No backend required</p>
      </footer>
    </div>
  );
}
