import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { BaseImagesPage } from './pages/BaseImagesPage';
import { CharactersPage } from './pages/CharactersPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditStudioPage } from './pages/EditStudioPage';
import { ExportHistoryPage } from './pages/ExportHistoryPage';
import { ExportPage } from './pages/ExportPage';
import { GeneratePage } from './pages/GeneratePage';
import { LogsPage } from './pages/LogsPage';
import { MasksPage } from './pages/MasksPage';
import { OutfitsPage } from './pages/OutfitsPage';
import { ResultDetailPage } from './pages/ResultDetailPage';
import { ResultsPage } from './pages/ResultsPage';
import { ReviewHistoryPage } from './pages/ReviewHistoryPage';
import { ReviewPage } from './pages/ReviewPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/characters" element={<CharactersPage />} />
        <Route path="/outfits" element={<OutfitsPage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/results/:id" element={<ResultDetailPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/review/history" element={<ReviewHistoryPage />} />
        <Route path="/edit-studio" element={<EditStudioPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/export/history" element={<ExportHistoryPage />} />
        <Route path="/masks" element={<MasksPage />} />
        <Route path="/base-images" element={<BaseImagesPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
