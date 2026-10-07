import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ConnectivityIndicator } from './ConnectivityIndicator.tsx';

function renderIndicator() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ConnectivityIndicator />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  onlineManager.setOnline(true);
});

describe('ConnectivityIndicator', () => {
  it('no muestra nada estando en línea y sin sincronizar', () => {
    renderIndicator();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('muestra "Sin conexión" cuando no hay red', () => {
    onlineManager.setOnline(false);
    renderIndicator();
    expect(screen.getByRole('status')).toHaveTextContent('Sin conexión');
  });
});
