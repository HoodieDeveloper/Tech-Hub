import { useState } from 'react';
import { ProductListPage } from './features/products/ProductListPage';
import { LoginPage } from './features/auth/LoginPage';
import { Package, ShoppingCart, User } from 'lucide-react';

type Page = 'products' | 'login';

export default function App() {
  const [page, setPage] = useState<Page>('products');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Package size={28} />
          <div>
            <h1>Tech Hub</h1>
            <p>Online Shop System</p>
          </div>
        </div>

        <button className="nav-button" onClick={() => setPage('products')}>
          <ShoppingCart size={18} /> Products
        </button>
        <button className="nav-button" onClick={() => setPage('login')}>
          <User size={18} /> Login
        </button>
      </aside>

      <main className="main-content">
        {page === 'products' && <ProductListPage />}
        {page === 'login' && <LoginPage />}
      </main>
    </div>
  );
}
