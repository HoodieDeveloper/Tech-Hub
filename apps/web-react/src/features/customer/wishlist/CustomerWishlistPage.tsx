import {
  ArrowLeft,
  Heart,
  Search,
  Truck,
  UserRound,
} from 'lucide-react';

import {
  CustomerProductCard,
} from '../layout/CustomerProductCard';

import type {
  Product,
} from '../../products/types';

import './CustomerWishlistPage.css';

type Props = {
  products: Product[];

  onBack: () => void;

  onProductClick: (
    product: Product,
  ) => void;

  onAddToCart: (
    product: Product,
  ) => void;

  onRemove: (
    productId: number,
  ) => void;
};

export function CustomerWishlistPage({
  products,
  onBack,
  onProductClick,
  onAddToCart,
  onRemove,
}: Props) {
  return (
    <div className="customer-wishlist-page">
      <div className="storefront-container wishlist-page-content">
        <div className="wishlist-page-header">
          <button
            type="button"
            className="wishlist-back-button"
            onClick={onBack}
          >
            <ArrowLeft size={18} />
            Home
          </button>

          <div>
            <h1>My Wishlist</h1>

            <p>
              {products.length}{' '}
              {products.length === 1
                ? 'saved product'
                : 'saved products'}
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="wishlist-empty">
            <Heart size={52} />

            <h2>
              Your wishlist is empty
            </h2>

            <p>
              Save products you like by
              clicking the heart.
            </p>

            <button
              type="button"
              onClick={onBack}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="wishlist-product-grid">
            {products.map(
              (product) => (
                <CustomerProductCard
                  key={product.id}
                  product={product}
                  onProductClick={onProductClick}
                  isWishlisted
                  onAddToCart={onAddToCart}
                  onRemove={onRemove}
                  showCategoryLabel
                  imageHeight={225}
                />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}