import { useEffect, useState } from 'react';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { apiGet, type AuthUser } from '../../core/api/client';
import { ProductImage } from '../products/ProductImage';
import type { Product } from '../products/types';

type Props = {
  productId: number;
  user: AuthUser;
  onBack: () => void;
};

export function CustomerProductDetailsPage({ productId, user, onBack }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<Product>(`/products/${productId}`)
      .then(setProduct)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unable to load product details.');
      });
  }, [productId]);

  return (
    <div className="details-page">
      <header className="simple-header">
        <button className="back-button" type="button" onClick={onBack}>
          <ArrowLeft size={18} /> Products
        </button>
        <span>Logged in as {user.name}</span>
      </header>

      {error && <div className="alert error">{error}</div>}
      {!product && !error && <div className="loading-card">Loading product details…</div>}

      {product && (
        <article className="details-card">
          <ProductImage imageUrl={product.image_url} alt={product.name} />
          <div className="details-content">
            <span className="eyebrow">Customer product page</span>
            <h1>{product.name}</h1>
            <p>{product.description || 'No description is available for this product.'}</p>
            <strong className="details-price">${Number(product.price).toFixed(2)}</strong>
            <span>{product.stock > 0 ? `${product.stock} units available` : 'Out of stock'}</span>
            <button type="button" disabled={product.stock <= 0}>
              <ShoppingCart size={18} /> Add to cart (next feature)
            </button>
          </div>
        </article>
      )}
    </div>
  );
}
