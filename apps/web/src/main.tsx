import { onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { RestTimerProvider } from './contexts/RestTimerContext.tsx';
import './index.css';
import { PERSIST_MAX_AGE, persister } from './lib/persister.ts';
import { queryClient } from './queryClient.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE }}
      onSuccess={() => {
        // Se restauró el cache desde IndexedDB: reanuda cualquier mutación
        // que haya quedado pausada offline en la sesión anterior. El
        // refetch solo tiene sentido si hay red — si no, solo generaría un
        // error de fetch sobre datos que ya están bien restaurados (la UI
        // igual prioriza mostrar el cache sobre un error, pero evitamos el
        // ruido).
        queryClient.resumePausedMutations().then(() => {
          if (onlineManager.isOnline()) {
            queryClient.invalidateQueries();
          }
        });
      }}
    >
      <BrowserRouter>
        <RestTimerProvider>
          <App />
        </RestTimerProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  </StrictMode>,
);
