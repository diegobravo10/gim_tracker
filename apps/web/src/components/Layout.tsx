import { Outlet } from 'react-router-dom';
import { useRestTimer } from '../hooks/useRestTimer.ts';
import { BottomNav } from './BottomNav.tsx';
import { RestTimerBar } from './RestTimerBar.tsx';

export function Layout() {
  const { remainingSeconds } = useRestTimer();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <main className={`mx-auto max-w-md px-4 pt-6 ${remainingSeconds === null ? 'pb-24' : 'pb-40'}`}>
        <Outlet />
      </main>
      <RestTimerBar />
      <BottomNav />
    </div>
  );
}
