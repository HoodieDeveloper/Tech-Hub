import {
  useEffect,
  useState,
} from 'react';

import {
  ChevronDown,
  Clock3,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRound,
} from 'lucide-react';

import {
  apiGet,
  type AuthUser,
} from '../../core/api/client';

import {
  ProductImage,
} from '../products/ProductImage';

import type {
  Product,
} from '../products/types';

type Props = {
  productId: number;

  user: AuthUser;

  onBack: () => void;

  onAddToCart?: (
    product: Product,
    quantity: number,
  ) => void;

  onBuyNow?: (
    product: Product,
    quantity: number,
  ) => void;
};

const colorOptions = [
  '#d9d9d9',
  '#7f7f7f',
  '#0b0b0c',
  '#d0d0d0',
  '#8a8a8a',
];

const storageOptions = [
  '256GB',
  '512GB',
  '1TB',
];

export function CustomerProductDetailsPage({
  productId,
  user,
  onBack,
  onAddToCart,
  onBuyNow,
}: Props) {
  const [
    product,
    setProduct,
  ] =
    useState<Product | null>(
      null,
    );

  const [
    quantity,
    setQuantity,
  ] =
    useState(1);

  const [
    error,
    setError,
  ] =
    useState('');

  useEffect(() => {
    setError('');
    setQuantity(1);

    apiGet<Product>(
      `/products/${productId}`,
    )
      .then(
        setProduct,
      )
      .catch(
        (err: unknown) => {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load product details.',
          );
        },
      );
  }, [productId]);

  function decreaseQuantity() {
    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1,
        ),
    );
  }

  function increaseQuantity() {
    if (!product) {
      return;
    }

    setQuantity(
      (current) =>
        Math.min(
          product.stock,
          current + 1,
        ),
    );
  }

  return (
    <div className="storefront-page product-detail-page">
      <div className="storefront-header-stack">
        <header className="storefront-main-header">
          <div className="storefront-container main-header-inner">
            <button
              type="button"
              className="store-brand"
              onClick={onBack}
            >
              <strong>
                DCS Computer Shop
              </strong>
            </button>

            <div className="store-search">
              <div className="search-input-wrap">
                <input
                  type="search"
                  placeholder="Search for product, brands or categories..."
                  aria-label="Search products"
                />

                <Search
                  size={18}
                />
              </div>
            </div>

            <div className="store-header-actions">
              <button
                type="button"
                className="header-icon-button"
              >
                <Heart
                  size={19}
                  fill="none"
                />

                <span>
                  Wishlist
                </span>
              </button>

              <button
                type="button"
                className="header-icon-button"
              >
                <UserRound
                  size={19}
                />

                <span>
                  {user.name}
                </span>
              </button>

              <button
                type="button"
                className="header-icon-button cart-header-button"
              >
                <ShoppingCart
                  size={20}
                />

                <span className="cart-count">
                  0
                </span>

                <span>
                  Cart
                </span>
              </button>
            </div>
          </div>
        </header>

        <nav className="store-navigation">
          <div className="storefront-container store-navigation-inner">
            <button
              type="button"
              className="active"
              onClick={onBack}
            >
              Home
            </button>

            <button
              type="button"
              onClick={onBack}
            >
              Shop by Category

              <ChevronDown
                size={14}
              />
            </button>

            <button
              type="button"
            >
              About
            </button>

            <button
              type="button"
            >
              Partnership
            </button>
          </div>
        </nav>
      </div>

      <main className="storefront-container product-detail-main">
        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {!product && !error && (
          <div className="loading-card">
            Loading product details…
          </div>
        )}

        {product && (
          <section className="product-detail-layout">
            <div className="product-detail-image-panel">
              <div className="product-detail-image-frame">
                <ProductImage
                  imageUrl={product.image_url}
                  alt={product.name}
                />
              </div>
            </div>

            <aside className="product-detail-info">
              <h1>{product.name}</h1>

              <div className="product-detail-price">
                ${Number(product.price).toFixed(2)}
              </div>

              <div className="product-option-group">
                <div className="product-option-label">Color</div>

                <div className="color-row">
                  {colorOptions.map((color, index) => (
                    <button
                      key={`${color}-${index}`}
                      type="button"
                      className={
                        index === 2 ? 'color-swatch active' : 'color-swatch'
                      }
                      style={{ background: color }}
                      aria-label={`Select color ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="product-option-group">
                <div className="product-option-label">Storage</div>

                <div className="storage-row">
                  {storageOptions.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      className={
                        index === 0 ? 'storage-option active' : 'storage-option'
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="product-option-group quantity-group">
                <div className="product-option-label">Quantity</div>

                <div className="quantity-control" aria-label="Quantity selection">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>

                  <span>{quantity}</span>

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stock}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="product-detail-actions">
                <button
                  type="button"
                  className="detail-primary-button"
                  disabled={product.stock <= 0}
                  onClick={() => onAddToCart?.(product, quantity)}
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>

                <button
                  type="button"
                  className="detail-secondary-button"
                  disabled={product.stock <= 0}
                  onClick={() => onBuyNow?.(product, quantity)}
                >
                  Buy Now
                </button>
              </div>
            </aside>
          </section>
        )}
      </main>

      <div className="store-benefits product-detail-benefits">
        <div className="benefit-item">
          <Truck size={25} />

          <div>
            <strong>Free Shipping</strong>
            <span>On orders over $49</span>
          </div>
        </div>

        <div className="benefit-item">
          <ShieldCheck size={25} />

          <div>
            <strong>Secure Payment</strong>
            <span>100% encrypted checkout</span>
          </div>
        </div>

        <div className="benefit-item">
          <RotateCcw size={25} />

          <div>
            <strong>Easy Returns</strong>
            <span>30-day return policy</span>
          </div>
        </div>

        <div className="benefit-item">
          <Clock3 size={25} />

          <div>
            <strong>24/7 Support</strong>
            <span>We're here to help</span>
          </div>
        </div>
      </div>

      <footer className="store-footer">
        <div className="storefront-container footer-grid">
          <div className="footer-brand">
            <h3>DCS Computer Shop</h3>
            <p>
              Your trusted destination for the latest tech, quality products and
              better experiences.
            </p>
            <div className="social-links">
              <button type="button" aria-label="Website">
                <Search size={15} />
              </button>
              <button type="button" aria-label="Messages">
                <Heart size={15} />
              </button>
              <button type="button" aria-label="Support">
                <UserRound size={15} />
              </button>
            </div>
          </div>

          <div className="footer-column">
            <h4>Shop</h4>
            <button type="button">All Categories</button>
            <button type="button">Best Sellers</button>
            <button type="button">New Arrivals</button>
            <button type="button">Deals</button>
          </div>

          <div className="footer-column">
            <h4>Customer Care</h4>
            <button type="button">Contact Us</button>
            <button type="button">Track Order</button>
            <button type="button">Returns &amp; Refunds</button>
            <button type="button">Shipping Info</button>
            <button type="button">FAQ</button>
          </div>

          <div className="footer-column">
            <h4>Company</h4>
            <button type="button">About DCS</button>
            <button type="button">Careers</button>
            <button type="button">Press</button>
            <button type="button">Sustainability</button>
          </div>

          <div className="footer-newsletter">
            <h4>Stay in the loop</h4>
            <p>Subscribe for exclusive deals and updates.</p>
            <div className="newsletter-form">
              <input type="email" placeholder="Enter Your Email" aria-label="Email address" />
              <button type="button">Subscribe</button>
            </div>

            <div className="payment-methods">
              <span>VISA</span>
              <span>PayPal</span>
              <span>Mastercard</span>
            </div>
          </div>
        </div>

        <div className="storefront-container footer-bottom">© 2026 DCS, All rights reserved.</div>
      </footer>
    </div>
  );
}