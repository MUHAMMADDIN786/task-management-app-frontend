import React, { useState, useEffect } from 'react';
import type { ID, Priority, Task, List } from '../types';
import { IconButton, Modal, Confirm, TextArea, TextField, Select, Badge } from './ui';


export function ListColumn({ list, tasks, onAddTask, onEditTask, onDeleteTask, onRenameList, onDeleteList }: {
list: List;
tasks: Task[];
onAddTask: (title: string, description: string, priority: Priority) => void;
onEditTask: (taskId: ID, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
onDeleteTask: (taskId: ID) => void;
onRenameList: (title: string) => void;
onDeleteList: () => void;
}) {
const [openNew, setOpenNew] = useState(false);
const [openEdit, setOpenEdit] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
const [confirmList, setConfirmList] = useState(false);


const [tTitle, setTTitle] = useState('');
const [tDesc, setTDesc] = useState('');
const [tPrio, setTPrio] = useState<Priority>('low');


const [editingTitle, setEditingTitle] = useState(false);
const [title, setTitle] = useState(list.title);
useEffect(() => setTitle(list.title), [list.title]);
return (
<div className="flex w-80 min-w-[18rem] max-w-sm flex-col gap-3 rounded-2xl bg-gray-50 p-3 shadow-sm">
<div className="flex items-center gap-2">
{editingTitle ? (
<input className="w-full rounded-xl border border-gray-200 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-gray-300" value={title} onChange={e => setTitle(e.target.value)} onBlur={() => { setEditingTitle(false); if (title.trim()) onRenameList(title); }} onKeyDown={e => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }} autoFocus />
) : (
<h3 className="flex-1 text-sm font-semibold" onDoubleClick={() => setEditingTitle(true)}>{list.title}</h3>
)}
<IconButton title="Delete list" className="text-red-600" onClick={() => setConfirmList(true)}>🗑️</IconButton>
</div>


<button onClick={() => setOpenNew(true)} className="rounded-xl border border-dashed border-gray-300 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100">+ Add task</button>


<div className="grid gap-2">
{tasks.map(t => <TaskRow key={t.id} task={t} onEdit={() => setOpenEdit({ open: true, task: t })} onDelete={() => onDeleteTask(t.id)} />)}
{tasks.length === 0 && <div className="rounded-xl border border-gray-200 bg-white p-3 text-center text-sm text-gray-500">No tasks</div>}
</div>


<Modal open={openNew} onClose={() => setOpenNew(false)} title="Add Task">
<div className="grid gap-3">
<TextField label="Title" value={tTitle} onChange={setTTitle} autoFocus />
<TextArea label="Description" value={tDesc} onChange={setTDesc} />
<Select label="Priority" value={tPrio} onChange={v => setTPrio(v as Priority)} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
<div className="flex justify-end gap-2">
<button className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100" onClick={() => setOpenNew(false)}>Cancel</button>
<button className="rounded-xl bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black" onClick={() => { onAddTask(tTitle, tDesc, tPrio); setTTitle(''); setTDesc(''); setTPrio('low'); setOpenNew(false); }}>Create</button>
</div>
</div>
</Modal>


<Modal open={openEdit.open} onClose={() => setOpenEdit({ open: false, task: null })} title="Edit Task">
{openEdit.task && (
<EditTaskForm task={openEdit.task} onCancel={() => setOpenEdit({ open: false, task: null })} onSave={patch => { onEditTask(openEdit.task!.id, patch); setOpenEdit({ open: false, task: null }); }} />
)}
</Modal>


<Confirm open={confirmList} onCancel={() => setConfirmList(false)} onConfirm={() => { setConfirmList(false); onDeleteList(); }} title="Delete list?" message="All tasks in this list will be deleted." />
</div>
);
}


function TaskRow({ task, onEdit, onDelete }: { task: Task; onEdit: () => void; onDelete: () => void }) {
const prioColor = task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
return (
<div className="group rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow">
<div className="mb-2 flex items-center justify-between">
<h4 className="font-medium">{task.title}</h4>
<span className={`ml-2 inline-block h-2 w-2 rounded-full ${prioColor}`} />
</div>
{task.description && <p className="mb-3 line-clamp-3 whitespace-pre-wrap text-sm text-gray-600">{task.description}</p>}
<div className="flex items-center justify-between text-xs text-gray-500">
<span>{new Date(task.createdAt).toLocaleDateString()}</span>
<div className="invisible flex gap-1 group-hover:visible">
<button onClick={onEdit} className="rounded-md px-2 py-1 hover:bg-gray-100">Edit</button>
<button onClick={onDelete} className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50">Delete</button>
</div>
</div>
</div>
);
}
function EditTaskForm({ task, onSave, onCancel }: { task: Task; onSave: (patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void; onCancel: () => void }) {
const [title, setTitle] = React.useState(task.title);
const [desc, setDesc] = React.useState(task.description ?? '');
const [prio, setPrio] = React.useState<Priority>(task.priority);
return (
<div className="grid gap-3">
<TextField label="Title" value={title} onChange={setTitle} autoFocus />
<TextArea label="Description" value={desc} onChange={setDesc} />
<Select label="Priority" value={prio} onChange={v => setPrio(v as Priority)} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
<div className="flex justify-between">
<span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">Created: {new Date(task.createdAt).toLocaleString()}</span>
<div className="flex gap-2">
<button onClick={onCancel} className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100">Cancel</button>
<button onClick={() => onSave({ title, description: desc || undefined, priority: prio })} className="rounded-xl bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black">Save</button>
</div>
</div>
</div>
);
}