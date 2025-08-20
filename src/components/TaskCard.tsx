import React from 'react';
import type { Task } from '../types';

export const TaskCard = React.memo(function TaskCard({ task, onEdit, onDelete }: { task: Task; onEdit: (task: Task) => void; onDelete: () => void }) {
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
          <button onClick={() => onEdit(task)} className="rounded-md px-2 py-1 hover:bg-gray-100">Edit</button>
          <button onClick={onDelete} className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50">Delete</button>
        </div>
      </div>
    </div>
  );
});