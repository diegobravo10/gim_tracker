import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/historial', label: 'Historial' },
  { to: '/rutinas', label: 'Rutinas' },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-neutral-800 bg-neutral-950">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === '/'}
          className={({ isActive }) =>
            `flex-1 py-3 text-center text-sm font-medium ${
              isActive ? 'text-emerald-400' : 'text-neutral-400'
            }`
          }
          style={{ minHeight: 48 }}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
