import { useIsMutating } from '@tanstack/react-query';
import { useOnline } from '../hooks/useOnline.ts';

export function ConnectivityIndicator() {
  const isOnline = useOnline();
  const isSyncing = useIsMutating() > 0;

  if (isOnline && !isSyncing) return null;

  return (
    <div
      className={`fixed inset-x-0 top-0 z-40 py-1 text-center text-xs font-medium ${
        isOnline ? 'bg-emerald-900 text-emerald-300' : 'bg-neutral-800 text-neutral-300'
      }`}
      role="status"
    >
      {isOnline ? 'Sincronizando…' : 'Sin conexión'}
    </div>
  );
}
