import React from 'react';
import type { Board, ID } from '../types';
import { IconButton, Modal, TextField, Confirm } from './ui';
import { deleteBoard as apiDeleteBoard, updateBoard as apiUpdateBoard } from '../api/board';
import { useAppStore } from '../store/AppStore';


export function BoardSelector({ boards, selectedId, onSelect }: { boards: Board[]; selectedId: ID | null; onSelect: (id: ID) => void }) {
const { dispatch } = useAppStore();
const [openRename, setOpenRename] = React.useState<{ id: ID | null; title: string }>({ id: null, title: '' });
const [confirmId, setConfirmId] = React.useState<ID | null>(null);


return (
<div className="flex flex-wrap items-center gap-2">
<div className="flex flex-wrap gap-2">
{boards.map(b => (
<button key={b.id} onClick={() => onSelect(b.id)} className={`rounded-2xl px-3 py-1.5 text-sm shadow-sm transition ${selectedId === b.id ? 'bg-gray-900 text-white' : 'bg-white hover:bg-gray-50'}`}>{b.title}</button>
))}
</div>
{selectedId && (
<div className="ml-auto flex items-center gap-2">
<IconButton title="Rename board" onClick={() => setOpenRename({ id: selectedId, title: boards.find(b => b.id === selectedId)?.title || '' })}>✏️ Rename</IconButton>
<IconButton title="Delete board" className="text-red-600" onClick={() => setConfirmId(selectedId!)}>🗑️ Delete</IconButton>
</div>
)}


<Modal open={openRename.id !== null} onClose={() => setOpenRename({ id: null, title: '' })} title="Rename Board">
<div className="grid gap-3">
<TextField label="Title" value={openRename.title} onChange={t => setOpenRename(v => ({ ...v, title: t }))} autoFocus />
<div className="flex justify-end gap-2">
<button className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100" onClick={() => setOpenRename({ id: null, title: '' })}>Cancel</button>
<button className="rounded-xl bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black" onClick={async () => {
if (!openRename.id) return;
await apiUpdateBoard(openRename.id, { title: openRename.title });
dispatch({ type: 'boards:rename', id: openRename.id, title: openRename.title });
setOpenRename({ id: null, title: '' });
}}>Save</button>
</div>
</div>
</Modal>


<Confirm open={confirmId !== null} onCancel={() => setConfirmId(null)} onConfirm={async () => {
if (!confirmId) return;
await apiDeleteBoard(confirmId);
dispatch({ type: 'boards:delete', id: confirmId });
setConfirmId(null);
}} title="Delete board?" message="This will remove the board, its lists and tasks." />
</div>
);
}

