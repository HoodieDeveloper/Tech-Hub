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
    <div className="storefront-page customer-wishlist-page">
      <div className="storefront-topbar">
        <div className="storefront-container storefront-topbar-inner">
          <span><Truck size={13} /> Free shipping on orders over $49</span>
          <div className="topbar-links">
            <span>Need help?</span>
            <span>+855 12 23 23 56</span>
            <span>Support</span>
            <span>Track Order</span>
            <span>English / USD</span>
          </div>
        </div>
      </div>

      <header className="storefront-main-header">
        <div className="storefront-container main-header-inner">
          <button type="button" className="store-brand" onClick={onBack}>
            <strong>DCS Computer Shop</strong>
          </button>

          <div className="store-search">
            <button type="button" className="category-button" aria-label="Choose category">All Categories</button>

            <div className="search-input-wrap">
              <input type="search" aria-label="Search products" placeholder="Search for product, brands or categories..." />
              <Search size={18} />
            </div>
          </div>

          <div className="store-header-actions" aria-label="Store actions">
            <button type="button" className="header-icon-button" aria-label="Wishlist"><Heart size={18} /><span>Wishlist</span></button>
            <button type="button" className="header-icon-button" aria-label="Account"><UserRound size={18} /><span>Account</span></button>
            <button type="button" className="header-icon-button cart-header-button" aria-label="Cart"><ShoppingCart size={18} /><span>Cart</span></button>
          </div>
        </div>
      </header>

      <nav className="store-navigation" aria-label="Main navigation">
        <div className="storefront-container store-navigation-inner">
          <button type="button" className="active" onClick={onBack}>Home</button>
          <button type="button" onClick={onBack}>Shop by Category <span>⌄</span></button>
          <button type="button">About</button>
          <button type="button">Partnership</button>
        </div>
      </nav>

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