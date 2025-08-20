import React from 'react';
import { createUser } from '../api/user';
import { useAppStore } from '../store/AppStore';


export default function NameGate() {
const { dispatch } = useAppStore();
const [name, setName] = React.useState('');
const [submitting, setSubmitting] = React.useState(false);
const [error, setError] = React.useState<string | null>(null);


async function onSubmit(e: React.FormEvent) {
e.preventDefault();
setError(null);
if (!name.trim()) { setError('Please enter your name'); return; }
try {
setSubmitting(true);
const user = await createUser(name.trim());
dispatch({ type: 'bootstrap:success', payload: { userId: user.id, userName: user.name, entities: { boards: {}, lists: {}, tasks: {} }, selectedBoardId: null } });
} catch (e: any) {
setError(e.message || 'Failed to create user');
} finally {
setSubmitting(false);
}
}


return (
<div className="grid min-h-screen place-items-center bg-gradient-to-b from-white to-gray-50 p-4">
<form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
<h1 className="mb-2 text-xl font-semibold">Welcome 👋</h1>
<p className="mb-4 text-sm text-gray-600">Enter your name to continue.</p>
<input className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
{error && <p className="mb-3 text-sm text-red-600">{error}</p>}
<button disabled={submitting} className="w-full rounded-xl bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black disabled:opacity-60">{submitting ? 'Creating…' : 'Continue'}</button>
</form>
</div>
);
}