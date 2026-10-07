import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App.tsx';

function renderAt(path: string) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('muestra la barra de navegación inferior', () => {
    renderAt('/rutinas');
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Historial' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Rutinas' })).toBeInTheDocument();
  });

  it('renderiza la pantalla de rutinas en /rutinas', () => {
    renderAt('/rutinas');
    expect(screen.getByRole('heading', { name: 'Rutinas' })).toBeInTheDocument();
    expect(screen.getByText('Próximamente.')).toBeInTheDocument();
  });
});
