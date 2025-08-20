import React from 'react';
import { useAppStore } from './store/AppStore';
import NameGate from './pages/NameGate';
import Dashboard from './pages/Dashboard';


export default function App() {
const { state } = useAppStore();
// Guard: if no user yet, stay on NameGate (no routing lib needed)
if (!state.userId) return <NameGate />;
return <Dashboard />;
}