import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.tsx';
import { ActiveWorkoutPage } from './pages/ActiveWorkoutPage.tsx';
import { ExerciseDetailPage } from './pages/ExerciseDetailPage.tsx';
import { HistoryDetailPage } from './pages/HistoryDetailPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { RoutineEditorPage } from './pages/RoutineEditorPage.tsx';
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
        <Route path="rutinas/:id" element={<RoutineEditorPage />} />
        <Route path="ejercicios/:id" element={<ExerciseDetailPage />} />
      </Route>
    </Routes>
  );
}

export default App;
