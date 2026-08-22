import {
  ArrowLeft,
  Heart,
  Search,
  ShoppingCart,
  Truck,
  Trash2,
  UserRound,
} from 'lucide-react';

import {
  ProductImage,
} from '../../products/ProductImage';

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
                <article
                  key={product.id}
                  className="wishlist-product-card"
                >
                  <button
                    type="button"
                    className="wishlist-product-main"
                    onClick={() =>
                      onProductClick(
                        product,
                      )
                    }
                  >
                    <div className="wishlist-product-image">
                      <ProductImage
                        imageUrl={
                          product.image_url
                        }
                        alt={
                          product.name
                        }
                      />
                    </div>

                    <div className="wishlist-product-info">
                      <span className="wishlist-category">
                        {product.category
                          ?.name ??
                          'Product'}
                      </span>

                      <h3>
                        {product.name}
                      </h3>

                      <strong className="wishlist-price">
                        $
                        {Number(
                          product.price,
                        ).toFixed(2)}
                      </strong>

                      <span
                        className={
                          product.stock > 0
                            ? 'wishlist-stock in-stock'
                            : 'wishlist-stock out-of-stock'
                        }
                      >
                        {product.stock > 0
                          ? `${product.stock} available`
                          : 'Out of stock'}
                      </span>
                    </div>
                  </button>

                  <div className="wishlist-card-actions">
                    <button
                      type="button"
                      className="wishlist-add-cart"
                      disabled={
                        product.stock <= 0
                      }
                      onClick={() =>
                        onAddToCart(
                          product,
                        )
                      }
                    >
                      <ShoppingCart
                        size={17}
                      />

                      Add to Cart
                    </button>

                    <button
                      type="button"
                      className="wishlist-remove"
                      title="Remove from wishlist"
                      onClick={() =>
                        onRemove(
                          product.id,
                        )
                      }
                    >
                      <Trash2
                        size={17}
                      />
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}