import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { del, get, set } from 'idb-keyval';

export const persister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get<string>(key),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
  key: 'gym-tracker-query-cache',
});

// Cuánto se conserva el cache persistido: lo suficiente para que un entreno
// a medias siga disponible aunque el celular pase varios días sin red.
export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24 * 7;
