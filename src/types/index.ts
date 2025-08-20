export type ID = number;
export type Priority = "low" | "medium" | "high";


// API models (as returned by your backend)
export interface ApiTask {
id: ID;
title: string;
description: string;
priority: Priority;
listId: ID;
createdAt: string; // ISO
}


export interface ApiList {
id: ID;
title: string;
boardId: ID;
taskIds: ID[]; // may be empty from API
createdAt: string;
updatedAt: string;
tasks: ApiTask[];
}


export interface ApiBoard {
id: ID;
title: string;
listIds: ID[];
userId: ID;
createdAt: string;
updatedAt: string;
lists: ApiList[];
}


// App entities (normalized)
export interface Task {
id: ID;
title: string;
description?: string;
priority: Priority;
createdAt: number; // epoch ms
}


export interface List {
id: ID;
title: string;
taskIds: ID[];
}


export interface Board {
id: ID;
title: string;
listIds: ID[];
}


export interface Entities {
tasks: Record<ID, Task>;
lists: Record<ID, List>;
boards: Record<ID, Board>;
}


export interface AppState {
userId: ID | null;
userName: string | null;
loading: boolean;
error: string | null;
selectedBoardId: ID | null;
entities: Entities;
}