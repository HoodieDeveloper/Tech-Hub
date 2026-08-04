import { useState } from 'react';
import {
  apiPost,
  clearAuthSession,
  getStoredUser,
  type AuthUser,
} from './core/api/client';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { LoginPage } from './features/auth/LoginPage';
import { CustomerProductDetailsPage } from './features/customer/CustomerProductDetailsPage';
import { PublicStorefront } from './features/storefront/PublicStorefront';
import type { Product } from './features/products/types';

type View = 'storefront' | 'login' | 'product-details' | 'admin';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [view, setView] = useState<View>(() =>
    getStoredUser()?.role === 'admin' ? 'admin' : 'storefront'
  );
  const [pendingProductId, setPendingProductId] = useState<number | null>(null);

  function handleProductClick(product: Product) {
    setPendingProductId(product.id);

    if (!user) {
      setView('login');
      return;
    }

    if (user.role === 'admin') {
      setView('admin');
      return;
    }

    setView('product-details');
  }

  function handleLoginSuccess(authenticatedUser: AuthUser) {
    setUser(authenticatedUser);

    if (authenticatedUser.role === 'admin') {
      setPendingProductId(null);
      setView('admin');
      return;
    }

    setView(pendingProductId ? 'product-details' : 'storefront');
  }

  async function handleLogout() {
    try {
      await apiPost('/logout', {});
    } catch {
      // The local session is still cleared if the token is already invalid.
    }

    clearAuthSession();
    setUser(null);
    setPendingProductId(null);
    setView('storefront');
  }

  if (view === 'login') {
    return (
      <LoginPage
        onSuccess={handleLoginSuccess}
        onBack={() => setView('storefront')}
      />
    );
  }

  if (view === 'admin' && user?.role === 'admin') {
    return (
      <AdminDashboard
        user={user}
        onStorefront={() => setView('storefront')}
        onLogout={() => void handleLogout()}
      />
    );
  }

  if (view === 'product-details' && user && pendingProductId) {
    return (
      <CustomerProductDetailsPage
        productId={pendingProductId}
        user={user}
        onBack={() => setView('storefront')}
      />
    );
  }

  return (
    <PublicStorefront
      user={user}
      onLogin={() => {
        setPendingProductId(null);
        setView('login');
      }}
      onAdminDashboard={() => setView('admin')}
      onProductClick={handleProductClick}
      onLogout={() => void handleLogout()}
    />
  );
}
