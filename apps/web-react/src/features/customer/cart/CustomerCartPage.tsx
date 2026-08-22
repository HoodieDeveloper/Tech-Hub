import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Globe2,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Truck,
  UserRound,
} from 'lucide-react';

import {
  useState,
} from 'react';

import {
  ProductImage,
} from '../../products/ProductImage';

import type {
  CartItem,
} from './types';

import './CustomerCartPage.css';

type Props = {
  cartItems: CartItem[];

  onBack: () => void;

  onIncrease: (
    productId: number,
  ) => void;

  onDecrease: (
    productId: number,
  ) => void;

  onRemove: (
    productId: number,
  ) => void;

  onCheckout: () => void;
};

export function CustomerCartPage({
  cartItems,
  onBack,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
}: Props) {
  const [discountCode, setDiscountCode] = useState('');

  const totalQuantity =
    cartItems.reduce(
      (total, item) =>
        total + item.quantity,
      0,
    );

  const subtotal =
    cartItems.reduce(
      (total, item) =>
        total +
        Number(
          item.product.price,
        ) *
          item.quantity,
      0,
    );

  /*
   * Backend currently uses
   * delivery_fee = 0.
   *
   * Keep frontend matching backend.
   */
  const deliveryFee = 0;

  const total =
    subtotal +
    deliveryFee;

  return (
    <div className="storefront-page customer-cart-page">
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
          <button type="button" className="header-icon-button cart-header-button" aria-label="Cart"><ShoppingCart size={18} /><span className="cart-count">{totalQuantity}</span><span>Cart</span></button>
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

      <div className="cart-page-header">
        <button
          type="button"
          className="cart-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Continue Shopping
        </button>

        <div>
          <h1>
            Shopping Cart
          </h1>

          <p>
            {totalQuantity}{' '}
            {totalQuantity === 1
              ? 'item'
              : 'items'}{' '}
            in your cart
          </p>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <ShoppingBag
            size={52}
          />

          <h2>
            Your cart is empty
          </h2>

          <p>
            Add some products
            before checking out.
          </p>

          <button
            type="button"
            onClick={onBack}
          >
            Shop Products
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Cart Products */}

          <section className="cart-products">
            {cartItems.map(
              (item) => {
                const product =
                  item.product;

                const lineTotal =
                  Number(
                    product.price,
                  ) *
                  item.quantity;

                return (
                  <article
                    key={
                      product.id
                    }
                    className="cart-product-card"
                  >
                    <div className="cart-product-image">
                      <ProductImage
                        imageUrl={
                          product.image_url
                        }
                        alt={
                          product.name
                        }
                      />
                    </div>

                    <div className="cart-product-details">
                      <h3>
                        {
                          product.name
                        }
                      </h3>

                      {product.category && (
                        <span className="cart-product-category">
                          {
                            product
                              .category
                              .name
                          }
                        </span>
                      )}

                      <span className="cart-stock">
                        {
                          product.stock
                        }{' '}
                        available
                      </span>
                    </div>

                    <div className="cart-product-price">
                      <strong>
                        $
                        {Number(
                          product.price,
                        ).toFixed(
                          2,
                        )}
                      </strong>

                      <span>
                        each
                      </span>
                    </div>

                    {/* Quantity */}

                    <div className="cart-quantity">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          onDecrease(
                            product.id,
                          )
                        }
                      >
                        <Minus
                          size={15}
                        />
                      </button>

                      <strong>
                        {
                          item.quantity
                        }
                      </strong>

                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={
                          item.quantity >=
                          product.stock
                        }
                        onClick={() =>
                          onIncrease(
                            product.id,
                          )
                        }
                      >
                        <Plus
                          size={15}
                        />
                      </button>
                    </div>

                    <div className="cart-line-total">
                      <strong>
                        $
                        {lineTotal.toFixed(
                          2,
                        )}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="cart-remove-button"
                      title="Remove product"
                      onClick={() =>
                        onRemove(
                          product.id,
                        )
                      }
                    >
                      <Trash2
                        size={18}
                      />
                    </button>
                  </article>
                );
              },
            )}
          </section>

          {/* Order Summary */}

          <aside className="cart-summary">
            <h2>
              Order Summary
            </h2>

            <div className="cart-summary-row">
              <span>
                Subtotal (
                {totalQuantity}{' '}
                items)
              </span>

              <strong>
                $
                {subtotal.toFixed(
                  2,
                )}
              </strong>
            </div>

            <div className="cart-summary-row">
              <span>
                Shipping
              </span>

              <strong className="cart-free-shipping">
                Free
              </strong>
            </div>

            <div className="cart-summary-divider" />

            <div className="cart-discount">
              <strong>Discount Code</strong>
              <div>
                <input
                  value={discountCode}
                  onChange={(event) => setDiscountCode(event.target.value)}
                  placeholder="Enter code"
                  aria-label="Discount code"
                />
                <button type="button">Apply</button>
              </div>
            </div>

            <div className="cart-summary-divider" />

            <div className="cart-summary-total">
              <span>
                Estimated Total
              </span>

              <strong>
                $
                {total.toFixed(
                  2,
                )}
              </strong>
            </div>

            <button
              type="button"
              className="cart-checkout-button"
              onClick={
                onCheckout
              }
            >
              Proceed to Checkout
            </button>

            <p className="cart-summary-note">
              Price and stock will
              be checked again when
              you place the order.
            </p>

            <div className="cart-trust-grid">
              <div><ShieldCheck size={22} /><span><strong>Secure payments</strong><small>100% protected</small></span></div>
              <div><Truck size={22} /><span><strong>Free returns</strong><small>30-day returns</small></span></div>
              <div><Clock3 size={22} /><span><strong>24/7 Support</strong><small>We're here to help</small></span></div>
            </div>
          </aside>
        </div>
      )}

      <footer className="store-footer cart-footer">
        <div className="storefront-container store-benefits">
          <div className="benefit-item"><Truck size={20} /><div><strong>Free Shipping</strong><span>On orders over $49</span></div></div>
          <div className="benefit-item"><ShieldCheck size={20} /><div><strong>Secure Payment</strong><span>100% encrypted checkout</span></div></div>
          <div className="benefit-item"><CheckCircle2 size={20} /><div><strong>Easy Returns</strong><span>30-day return policy</span></div></div>
          <div className="benefit-item"><Clock3 size={20} /><div><strong>24/7 Support</strong><span>We're here to help</span></div></div>
        </div>
        <div className="storefront-container footer-grid cart-footer-columns">
          <div className="footer-brand"><h3>DCS Computer Shop</h3><p>Your trusted destination for the latest tech, quality products and better experiences.</p><div className="social-links"><button type="button"><Globe2 size={15} /></button><button type="button"><MessageCircle size={15} /></button><button type="button"><Heart size={15} /></button></div></div>
          <div className="footer-column"><h4>Shop</h4><span>All Categories</span><span>Best Sellers</span><span>New Arrivals</span><span>Deals</span></div>
          <div className="footer-column"><h4>Customer Care</h4><span>Contact Us</span><span>Track Order</span><span>Returns & Refunds</span><span>Shipping Info</span></div>
          <div className="footer-column"><h4>Company</h4><span>About DCS</span><span>Careers</span><span>Press</span><span>Sustainability</span></div>
          <div className="footer-newsletter"><h4>Stay in the loop</h4><p>Subscribe for exclusive deals and updates.</p><div className="newsletter-form"><input placeholder="Enter Your Email" aria-label="Email address" /><button type="button">Subscribe</button></div></div>
        </div>
        <div className="storefront-container footer-bottom cart-footer-bottom">© 2026 DCS, All rights reserved.</div>
      </footer>
    </div>
  );
}