import React from 'react';

export const IconButton = React.memo(function IconButton({ title, onClick, children, className = '' }: React.PropsWithChildren<{ title: string; onClick?: () => void; className?: string }>) {
  return (
    <button title={title} onClick={onClick} className={"inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100 active:scale-[.98] transition " + className}>
      {children}
    </button>
  );
});

export const Badge = React.memo(function Badge({ children }: React.PropsWithChildren) {
  return <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{children}</span>;
});

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
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

export function Confirm({ open, onCancel, onConfirm, title, message }: { open: boolean; onCancel: () => void; onConfirm: () => void; title: string; message: string }) {
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

export function TextField({ label, value, onChange, placeholder, autoFocus }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-gray-600">{label}</span>
      <input className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} />
    </label>
  );
}

export function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-gray-600">{label}</span>
      <textarea className="min-h-[90px] rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-gray-600">{label}</span>
      <select className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
