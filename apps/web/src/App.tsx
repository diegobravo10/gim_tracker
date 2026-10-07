import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.tsx';
import { ActiveWorkoutPage } from './pages/ActiveWorkoutPage.tsx';
import { HistoryDetailPage } from './pages/HistoryDetailPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { RoutinesPage } from './pages/RoutinesPage.tsx';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="entreno" element={<ActiveWorkoutPage />} />
        <Route path="historial" element={<HistoryPage />} />
        <Route path="historial/:id" element={<HistoryDetailPage />} />
        <Route path="rutinas" element={<RoutinesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
