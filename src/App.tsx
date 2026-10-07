import { Route, Routes } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { FlowerPage } from '@/pages/FlowerPage';
import { LoginPage } from '@/pages/LoginPage';
import { OwnerDashboard } from '@/owner/OwnerDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/flowers/:slug/" element={<FlowerPage />} />
      <Route path="/flowers/:slug" element={<FlowerPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/owner" element={<OwnerDashboard />} />
      <Route path="/owner/*" element={<OwnerDashboard />} />
    </Routes>
  );
}
