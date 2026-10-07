import { useIsMutating } from '@tanstack/react-query';
import { Outlet } from 'react-router-dom';
import { useOnline } from '../hooks/useOnline.ts';
import { useRestTimer } from '../hooks/useRestTimer.ts';
import { BottomNav } from './BottomNav.tsx';
import { ConnectivityIndicator } from './ConnectivityIndicator.tsx';
import { RestTimerBar } from './RestTimerBar.tsx';

export function Layout() {
  const { remainingSeconds } = useRestTimer();
  const isOnline = useOnline();
  const isSyncing = useIsMutating() > 0;
  const showConnectivityBanner = !isOnline || isSyncing;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <ConnectivityIndicator />
      <main
        className={`mx-auto max-w-md px-4 ${showConnectivityBanner ? 'pt-12' : 'pt-6'} ${
          remainingSeconds === null ? 'pb-24' : 'pb-40'
        }`}
      >
        <Outlet />
      </main>
      <RestTimerBar />
      <BottomNav />
    </div>
  );
}
