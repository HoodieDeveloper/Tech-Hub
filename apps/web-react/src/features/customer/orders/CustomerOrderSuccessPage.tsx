import {
  CheckCircle2,
  MapPin,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
} from 'lucide-react';

import {
  ProductImage,
} from '../../products/ProductImage';

import type {
  CustomerOrderResult,
} from './types';

import './CustomerOrderSuccessPage.css';

type Props = {
  order: CustomerOrderResult;
  onViewOrders: () => void;
  onContinueShopping: () => void;
};

function formatMoney(
  amount: string,
  currency: string,
) {
  const value =
    Number(amount).toFixed(2);

  return currency === 'USD'
    ? `$${value}`
    : `${currency} ${value}`;
}

function paymentLabel(
  method:
    | string
    | null
    | undefined,
) {
  if (
    method ===
    'cash_on_delivery'
  ) {
    return 'Cash on Delivery';
  }

  if (
    method ===
    'fake_card'
  ) {
    return 'Saved Demo Card';
  }

  if (
    method ===
    'bank_transfer'
  ) {
    return 'Card / Bank Payment';
  }

  return method
    ? method
        .replace(/_/g, ' ')
        .replace(
          /\b\w/g,
          (character) =>
            character.toUpperCase(),
        )
    : 'Not specified';
}

export function CustomerOrderSuccessPage({
  order,
  onViewOrders,
  onContinueShopping,
}: Props) {
  return (
    <div className="customer-order-success-page techhub-page-enter">
      <section className="order-success-hero">
        <span className="order-success-icon">
          <CheckCircle2
            size={54}
          />
        </span>

        <p className="order-success-eyebrow">
          Order confirmed
        </p>

        <h1>
          {order.payment_status === 'paid'
            ? 'Payment successful'
            : 'Your order was placed successfully'}
        </h1>

        <p className="order-success-copy">
          Thanks for shopping with DCS Computer Shop. Your order is now in our system and can be tracked from My Orders.
        </p>

        <div className="order-success-number">
          <span>Order ID</span>
          <strong>
            {order.order_number}
          </strong>
        </div>
      </section>

      <section className="order-success-summary-grid">
        <article>
          <ReceiptText size={22} />
          <div>
            <span>Order Total</span>
            <strong>
              {formatMoney(
                order.total,
                order.currency,
              )}
            </strong>
          </div>
        </article>

        <article>
          <PackageCheck size={22} />
          <div>
            <span>Order Status</span>
            <strong className="order-success-capitalize">
              {order.status}
            </strong>
          </div>
        </article>

        <article>
          <ShoppingBag size={22} />
          <div>
            <span>Payment</span>
            <strong>
              {paymentLabel(
                order.payment_method,
              )}
            </strong>
            <small className="order-success-payment-status">
              Status: {order.payment_status}
            </small>
          </div>
        </article>
      </section>

      {order.shipping_latitude != null &&
        order.shipping_longitude != null && (
          <section className="order-success-location-card">
            <MapPin size={21} />
            <div>
              <span>Delivery Pin</span>
              <strong>Google Maps location saved with this order</strong>
            </div>
            <a
              href={`https://www.google.com/maps?q=${order.shipping_latitude},${order.shipping_longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              Open Map
            </a>
          </section>
        )}

      <section className="order-success-items-card">
        <div className="order-success-section-heading">
          <div>
            <h2>Order Items</h2>
            <p>
              {order.items.length}{' '}
              {order.items.length === 1
                ? 'product'
                : 'products'}
            </p>
          </div>
        </div>

        <div className="order-success-items">
          {order.items.map(
            (item) => (
              <div
                className="order-success-item"
                key={item.id}
              >
                <div className="order-success-item-main">
                  <div className="order-success-item-image">
                    <ProductImage
                      imageUrl={
                        item.product
                          ?.image_url ??
                        null
                      }
                      alt={
                        item.product_name
                      }
                    />
                  </div>

                  <div>
                    <strong>
                      {item.product_name}
                    </strong>
                    <span>
                      Quantity: {item.quantity}
                    </span>
                  </div>
                </div>

                <strong className="order-success-item-price">
                  {formatMoney(
                    item.line_total,
                    order.currency,
                  )}
                </strong>
              </div>
            ),
          )}
        </div>
      </section>

      <div className="order-success-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={
            onContinueShopping
          }
        >
          Continue Shopping
        </button>

        <button
          type="button"
          onClick={
            onViewOrders
          }
        >
          View My Orders
        </button>
      </div>
    </div>
  );
}
