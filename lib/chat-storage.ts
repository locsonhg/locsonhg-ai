export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatSession = {
  id: string;
  title: string;
  systemPrompt: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

const DB_NAME = "locsonhg-ai-db";
const DB_VERSION = 1;
const STORE = "chatSessions";

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllSessions(): Promise<ChatSession[]> {
  const db = await openDatabase();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const rows = (request.result as ChatSession[]) ?? [];
      rows.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(rows);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function upsertSession(session: ChatSession): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.put(session);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function createSessionDraft(params: {
  systemPrompt: string;
  messages: ChatMessage[];
}): ChatSession {
  const now = Date.now();

  return {
    id: now.toString(36) + Math.random().toString(36).slice(2, 8),
    title: "Doan chat moi",
    systemPrompt: params.systemPrompt,
    messages: params.messages,
    createdAt: now,
    updatedAt: now,
  };
}
