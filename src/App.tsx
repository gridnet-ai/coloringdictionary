import { Navigate, Route, Routes } from 'react-router-dom';
import { StaffSeoShield } from '@/components/StaffSeoShield';
import { HomePage } from '@/pages/HomePage';
import { FlowerPage } from '@/pages/FlowerPage';
import { ConsumerLoginPage, StaffLoginPage } from '@/pages/LoginPage';
import { ShopPage } from '@/pages/ShopPage';
import { ShopSuccessPage } from '@/pages/ShopSuccessPage';
import { OwnerDashboard } from '@/owner/OwnerDashboard';

function StaffApp() {
  return (
    <StaffSeoShield>
      <OwnerDashboard />
    </StaffSeoShield>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/shop/success" element={<ShopSuccessPage />} />
      <Route path="/flowers/:slug/" element={<FlowerPage />} />
      <Route path="/flowers/:slug" element={<FlowerPage />} />

      {/* Consumer account */}
      <Route path="/login" element={<ConsumerLoginPage />} />

      {/* Staff — private path; noindex + robots Disallow (direct URL / MCP still works) */}
      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route path="/staff" element={<StaffApp />} />
      <Route path="/staff/*" element={<StaffApp />} />

      {/* Legacy owner URLs → staff */}
      <Route path="/owner" element={<Navigate to="/staff" replace />} />
      <Route path="/owner/*" element={<Navigate to="/staff" replace />} />
      <Route path="/owner/login" element={<Navigate to="/staff/login" replace />} />
    </Routes>
  );
}
