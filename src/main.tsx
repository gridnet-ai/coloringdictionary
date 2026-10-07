import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { initClarity } from '@/lib/clarity';
import { initAnalytics } from '@/lib/firebase';
import '@/styles/site.css';
import '@/styles/login.css';
import '@/styles/owner.css';
import '@/styles/shop.css';

initClarity();
void initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
