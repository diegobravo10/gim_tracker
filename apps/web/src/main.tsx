import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { RestTimerProvider } from './contexts/RestTimerContext.tsx';
import './index.css';
import { queryClient } from './queryClient.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RestTimerProvider>
          <App />
        </RestTimerProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
