import { QueryClient, onlineManager } from '@tanstack/react-query';
import { registerOfflineMutationDefaults } from './offlineMutations.ts';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

registerOfflineMutationDefaults(queryClient);

// Al volver la red, reintenta las mutaciones que quedaron pausadas offline
// (series/ejercicios creados o editados sin conexión) y refresca todo lo
// demás. PersistQueryClientProvider ya llama esto una vez al restaurar el
// cache en el arranque; esta suscripción cubre además el caso de quedarse
// sin red y recuperarla con la app ya abierta.
onlineManager.subscribe((isOnline) => {
  if (isOnline) {
    queryClient.resumePausedMutations().then(() => {
      queryClient.invalidateQueries();
    });
  }
});
