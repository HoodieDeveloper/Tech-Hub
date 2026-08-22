import {
  ArrowLeft,
  Clock3,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
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
    <div className="customer-cart-page">

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
                        size={25}
                        strokeWidth={2.4}
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
    </div>
  );
}