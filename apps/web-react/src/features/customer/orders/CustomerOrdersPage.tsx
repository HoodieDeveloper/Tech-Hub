import {
  useEffect,
  useState,
} from 'react';

import {
  ArrowLeft,
  Package,
  RefreshCw,
} from 'lucide-react';

import {
  apiGet,
} from '../../../core/api/client';

import './CustomerOrdersPage.css';

type OrderProduct = {
  id: number;
  image_url: string | null;
};

type OrderItem = {
  id: number;
  product_id: number;
  product_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;

  product?: OrderProduct | null;
};

type CustomerOrder = {
  id: number;
  order_number: string;
  currency: string;
  created_at: string;
  items: OrderItem[];
};

type OrdersResponse = {
  orders: CustomerOrder[];
};

type Props = {
  onBack: () => void;
};

export function CustomerOrdersPage({
  onBack,
}: Props) {
  const [
    orders,
    setOrders,
  ] =
    useState<CustomerOrder[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState('');

  function loadOrders() {
    setLoading(true);
    setError('');

    apiGet<OrdersResponse>(
      '/orders',
    )
      .then((data) => {
        setOrders(
          data.orders,
        );
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load your orders.',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function formatMoney(
    amount: string,
    currency: string,
  ) {
    const value =
      Number(amount).toFixed(2);

    if (
      currency === 'USD'
    ) {
      return `$${value}`;
    }

    return `${currency} ${value}`;
  }

  return (
    <div className="customer-orders-page">
      <div className="customer-orders-container">

        {/* =========================
            TOP ACTIONS
        ========================== */}

        <div className="customer-orders-top">
          <button
            type="button"
            className="customer-orders-back"
            onClick={onBack}
          >
            <ArrowLeft size={18} />

            Back to Store
          </button>

          <button
            type="button"
            className="customer-orders-refresh"
            onClick={loadOrders}
            disabled={loading}
          >
            <RefreshCw
              size={17}
            />

            {loading
              ? 'Loading...'
              : 'Refresh'}
          </button>
        </div>

        {/* =========================
            HEADING
        ========================== */}

        <div className="customer-orders-heading">
          <h1>
            My Orders
          </h1>

          <p>
            View your order history
            and purchased items.
          </p>
        </div>

        {/* =========================
            ERROR
        ========================== */}

        {error && (
          <div className="customer-orders-error">
            {error}
          </div>
        )}

        {/* =========================
            EMPTY
        ========================== */}

        {!loading &&
          !error &&
          orders.length === 0 && (
            <div className="customer-orders-empty">
              <Package
                size={44}
              />

              <strong>
                No orders yet
              </strong>

              <p>
                You have not placed
                any orders yet.
              </p>
            </div>
          )}

        {/* =========================
            ORDERS
        ========================== */}

        {!loading &&
          !error &&
          orders.length > 0 && (
            <div className="customer-orders-list">
              {orders.map(
                (order) => (
                  <article
                    key={order.id}
                    className="customer-order-card"
                  >

                    {/* ORDER HEADER */}

                    <div className="customer-order-header">
                      <div className="customer-order-number">
                        <span>
                          Order ID
                        </span>

                        <strong>
                          {
                            order.order_number
                          }
                        </strong>
                      </div>

                      <span className="customer-order-date">
                        {new Date(
                          order.created_at,
                        ).toLocaleDateString(
                          undefined,
                          {
                            year:
                              'numeric',

                            month:
                              'short',

                            day:
                              'numeric',
                          },
                        )}
                      </span>
                    </div>

                    {/* ORDER ITEMS */}

                    <div className="customer-order-items">
                      <h3>
                        Order Items
                      </h3>

                      {order.items.map(
                        (item) => (
                          <div
                            key={item.id}
                            className="customer-order-item"
                          >
                            <div className="customer-order-item-main">

                              {/* PRODUCT IMAGE */}

                              <div className="customer-order-item-image">
                                {item.product?.image_url ? (
                                  <img
                                    src={
                                      item.product
                                        .image_url
                                    }
                                    alt={
                                      item.product_name
                                    }
                                  />
                                ) : (
                                  <div className="customer-order-item-image-placeholder">
                                    <Package
                                      size={26}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* NAME + QUANTITY */}

                              <div className="customer-order-item-name">
                                <strong>
                                  {
                                    item.product_name
                                  }
                                </strong>

                                <span>
                                  Quantity:{' '}
                                  {
                                    item.quantity
                                  }
                                </span>
                              </div>
                            </div>

                            {/* PRICE */}

                            <span className="customer-order-item-total">
                              {formatMoney(
                                item.line_total,
                                order.currency,
                              )}
                            </span>
                          </div>
                        ),
                      )}
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