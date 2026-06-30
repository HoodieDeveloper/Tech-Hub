import { useEffect, useState } from 'react';
import { apiGet } from '../../core/api/client';
import type { Product } from './types';

export function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<Product[]>('/products')
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p>Products from Laravel API and Supabase database.</p>
        </div>
      </div>

      {loading && <p className="message">Loading products...</p>}
      {error && <p className="error">{error}</p>}

      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-image">
              {product.image_url ? <img src={product.image_url} alt={product.name} /> : 'No Image'}
            </div>
            <div className="product-body">
              <h3>{product.name}</h3>
              <p>{product.description || 'No description yet.'}</p>
              <div className="product-meta">
                <strong>${Number(product.price).toFixed(2)}</strong>
                <span>Stock: {product.stock}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
