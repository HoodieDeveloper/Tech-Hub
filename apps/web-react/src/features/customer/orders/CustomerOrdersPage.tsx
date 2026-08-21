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

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

type PaymentStatus =
  | 'unpaid'
  | 'paid';

type OrderItem = {
  id: number;
  product_id: number;
  product_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
};

type CustomerOrder = {
  id: number;
  order_number: string;

  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;

  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;

  subtotal: string;
  delivery_fee: string;
  total: string;
  currency: string;

  notes: string | null;

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
  ] = useState<CustomerOrder[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

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
            and current order status.
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
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          },
                        )}
                      </span>
                    </div>

                    {/* ORDER INFORMATION */}

                    <div className="customer-order-info">
                      <div className="customer-order-info-item">
                        <span>
                          Payment Status
                        </span>

                        <span
                          className={`customer-order-status ${order.payment_status}`}
                        >
                          {
                            order.payment_status
                          }
                        </span>
                      </div>

                      <div className="customer-order-info-item">
                        <span>
                          Delivery Status
                        </span>

                        <span
                          className={`customer-order-status ${order.status}`}
                        >
                          {
                            order.status
                          }
                        </span>
                      </div>

                      <div className="customer-order-info-item">
                        <span>
                          Order Total
                        </span>

                        <span className="customer-order-total">
                          {formatMoney(
                            order.total,
                            order.currency,
                          )}
                        </span>
                      </div>
                    </div>

                    {/* ITEMS */}

                    <div className="customer-order-items">
                      <h3>
                        Order Items
                      </h3>

                      {order.items.map(
                        (item) => (
                          <div
                            key={
                              item.id
                            }
                            className="customer-order-item"
                          >
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