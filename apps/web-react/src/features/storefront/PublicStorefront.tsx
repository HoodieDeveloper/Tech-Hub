import { useEffect, useState } from 'react';
import { LogIn, RefreshCw, ShieldCheck, ShoppingBag } from 'lucide-react';
import { API_URL, apiGet, type AuthUser } from '../../core/api/client';
import { ProductImage } from '../products/ProductImage';
import type { Product } from '../products/types';

type Props = {
  user: AuthUser | null;
  onLogin: () => void;
  onAdminDashboard: () => void;
  onProductClick: (product: Product) => void;
  onLogout: () => void;
};

export function PublicStorefront({
  user,
  onLogin,
  onAdminDashboard,
  onProductClick,
  onLogout,
}: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadProducts() {
    setLoading(true);
    setError('');

    try {
      const data = await apiGet<Product[]>('/products', false);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  return (
    <div className="storefront-page">
      <header className="storefront-header">
        <button className="brand-button" type="button">
          <ShoppingBag size={25} />
          <span>
            <strong>TechHub</strong>
            <small>Technology marketplace</small>
          </span>
        </button>

        <div className="header-actions">
          {user ? (
            <>
              <span className="signed-in-user">
                {user.name} · {user.role}
              </span>
              {user.role === 'admin' && (
                <button type="button" className="secondary-button" onClick={onAdminDashboard}>
                  <ShieldCheck size={17} /> Admin dashboard
                </button>
              )}
              <button type="button" className="ghost-button" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <button type="button" onClick={onLogin}>
              <LogIn size={17} /> Login
            </button>
          )}
        </div>
      </header>

      <main className="storefront-main">
        <section className="hero-section">
          <div>
            <span className="eyebrow">Browse without an account</span>
            <h1>Find the technology you need.</h1>
            <p>
              Everyone can view the product catalog. Login is required only when a
              customer opens a product or continues to protected actions.
            </p>
          </div>
          <div className="api-pill">API: {API_URL}</div>
        </section>

        <section className="catalog-section">
          <div className="section-heading">
            <div>
              <h2>Products</h2>
              <p>Click a product to continue.</p>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={() => void loadProducts()}
              disabled={loading}
            >
              <RefreshCw size={17} /> {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>

          {error && <div className="alert error">{error}</div>}
          {loading && <div className="loading-card">Loading products…</div>}

          {!loading && products.length === 0 && (
            <div className="empty-state">No active products are available yet.</div>
          )}

          <div className="public-product-grid">
            {products.map((product) => (
              <button
                type="button"
                className="public-product-card"
                key={product.id}
                onClick={() => onProductClick(product)}
              >
                <ProductImage imageUrl={product.image_url} alt={product.name} />
                <div className="public-product-body">
                  <h3>{product.name}</h3>
                  <p>{product.description || 'No description yet.'}</p>
                  <div className="product-price-row">
                    <strong>${Number(product.price).toFixed(2)}</strong>
                    <span>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
