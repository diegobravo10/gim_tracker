import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav.tsx';

export function Layout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <main className="mx-auto max-w-md px-4 pb-24 pt-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
