import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Package,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

import {
  apiGet,
  apiPatch,
} from '../../../core/api/client';

import './OrdersPage.css';

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

type AdminOrder = {
  id: number;
  order_number: string;
  user_id: number;

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
};

type OrdersResponse = {
  orders: AdminOrder[];

  summary: {
    total: number;
    pending: number;
    confirmed: number;
    preparing: number;
    shipped: number;
    completed: number;
    cancelled: number;
  };
};

type CustomerHistoryResponse = {
  customer: {
    id: number;
    name: string;
    email: string;
  };

  orders: AdminOrder[];
};

type UpdateOrderResponse = {
  message: string;
  order: AdminOrder;
};

export function AdminOrdersPage() {
  const [data, setData] =
    useState<OrdersResponse | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] =
    useState<number | null>(null);

  const [
    updatingPaymentId,
    setUpdatingPaymentId,
  ] =
    useState<number | null>(null);

  const [
    customerHistory,
    setCustomerHistory,
  ] =
    useState<CustomerHistoryResponse | null>(
      null,
    );

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  function loadOrders() {
    setLoading(true);
    setError('');

    apiGet<OrdersResponse>(
      '/admin/orders',
    )
      .then(setData)
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load orders.',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateOrderStatus(
    orderId: number,
    status: OrderStatus,
  ) {
    setUpdatingOrderId(orderId);

    try {
      await apiPatch<UpdateOrderResponse>(
        `/admin/orders/${orderId}/status`,
        {
          status,
        },
      );

      loadOrders();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Unable to update order status.',
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function updatePaymentStatus(
    orderId: number,
    paymentStatus: PaymentStatus,
  ) {
    setUpdatingPaymentId(orderId);

    try {
      await apiPatch<UpdateOrderResponse>(
        `/admin/orders/${orderId}/payment-status`,
        {
          payment_status:
            paymentStatus,
        },
      );

      loadOrders();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Unable to update payment status.',
      );
    } finally {
      setUpdatingPaymentId(null);
    }
  }

  async function viewCustomerHistory(
    userId: number,
  ) {
    setHistoryLoading(true);

    try {
      const history =
        await apiGet<CustomerHistoryResponse>(
          `/admin/customers/${userId}/orders`,
        );

      setCustomerHistory(history);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Unable to load order history.',
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() {
    setCustomerHistory(null);
  }

  const filteredOrders =
    data?.orders.filter((order) => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return true;
      }

      return (
        order.order_number
          .toLowerCase()
          .includes(keyword) ||
        order.customer_name
          .toLowerCase()
          .includes(keyword) ||
        order.customer_email
          .toLowerCase()
          .includes(keyword)
      );
    }) ?? [];

  if (loading && !data) {
    return (
      <section className="admin-info-card">
        <p>
          Loading orders...
        </p>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="admin-info-card">
        <div className="alert error">
          {error}
        </div>

        <button
          type="button"
          onClick={loadOrders}
        >
          Try again
        </button>
      </section>
    );
  }

  return (
    <>
      <section className="admin-orders-page">

        <div className="stat-grid">

          <OrderStatCard
            label="Pending Orders"
            value={
              data?.summary.pending ?? 0
            }
            icon={Clock3}
          />

          <OrderStatCard
            label="Processing Orders"
            value={
              (data?.summary.confirmed ?? 0) +
              (data?.summary.preparing ?? 0) +
              (data?.summary.shipped ?? 0)
            }
            icon={RefreshCw}
          />

          <OrderStatCard
            label="Completed Orders"
            value={
              data?.summary.completed ?? 0
            }
            icon={CheckCircle2}
          />

        </div>

        <div className="admin-info-card">

          <div className="admin-orders-header">

            <div>
              <h2>
                Customer Orders
              </h2>

              <p>
                View and manage orders
                placed by customers.
              </p>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
            >
              <RefreshCw size={17} />

              {loading
                ? 'Loading...'
                : 'Refresh'}
            </button>

          </div>

          <div className="orders-search-box">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search order ID, customer name or email..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />

          </div>

          {filteredOrders.length === 0 ? (

            <div className="admin-orders-empty">

              <Package size={40} />

              <p>
                No matching orders found.
              </p>

            </div>

          ) : (

            <div className="admin-table-wrapper">

              <table className="admin-table">

                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>

                    <th>
                      Payment Status
                    </th>

                    <th>
                      Delivery Status
                    </th>

                    <th>
                      History
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {filteredOrders.map(
                    (order) => (

                      <tr key={order.id}>

                        <td>
                          <strong>
                            {
                              order.order_number
                            }
                          </strong>
                        </td>

                        <td>
                          <div>
                            <strong>
                              {
                                order.customer_name
                              }
                            </strong>

                            <br />

                            <small>
                              {
                                order.customer_email
                              }
                            </small>
                          </div>
                        </td>

                        <td>
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
                        </td>

                        <td>
                          {order.currency ===
                          'USD'
                            ? '$'
                            : `${order.currency} `}

                          {Number(
                            order.total,
                          ).toFixed(2)}
                        </td>

                        <td>
                          <select
                            className={`order-status-select ${order.payment_status}`}
                            value={
                              order.payment_status
                            }
                            disabled={
                              updatingPaymentId ===
                              order.id
                            }
                            onChange={(
                              event,
                            ) =>
                              updatePaymentStatus(
                                order.id,
                                event.target
                                  .value as PaymentStatus,
                              )
                            }
                          >
                            <option value="unpaid">
                              Unpaid
                            </option>

                            <option value="paid">
                              Paid
                            </option>
                          </select>
                        </td>

                        <td>
                          <select
                            className={`order-status-select ${order.status}`}
                            value={
                              order.status
                            }
                            disabled={
                              updatingOrderId ===
                              order.id
                            }
                            onChange={(
                              event,
                            ) =>
                              updateOrderStatus(
                                order.id,
                                event.target
                                  .value as OrderStatus,
                              )
                            }
                          >
                            <option value="pending">
                              Pending
                            </option>

                            <option value="confirmed">
                              Confirmed
                            </option>

                            <option value="preparing">
                              Preparing
                            </option>

                            <option value="shipped">
                              Shipped
                            </option>

                            <option value="completed">
                              Completed
                            </option>

                            <option value="cancelled">
                              Cancelled
                            </option>
                          </select>
                        </td>

                        <td>
                          <button
                            type="button"
                            onClick={() =>
                              viewCustomerHistory(
                                order.user_id,
                              )
                            }
                            disabled={
                              historyLoading
                            }
                          >
                            View History
                          </button>
                        </td>

                      </tr>
                    ),
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </section>

      {customerHistory && (
        <div
          className="order-history-overlay"
          onClick={closeHistory}
        >

          <div
            className="order-history-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="order-history-header">

              <div>
                <h2>
                  Customer Order History
                </h2>

                <strong>
                  {
                    customerHistory
                      .customer.name
                  }
                </strong>

                <p>
                  {
                    customerHistory
                      .customer.email
                  }
                </p>
              </div>

              <button
                type="button"
                className="order-history-close"
                onClick={closeHistory}
              >
                <X size={20} />
              </button>

            </div>

            <div className="order-history-content">

              <p>
                Total Orders:{' '}

                <strong>
                  {
                    customerHistory
                      .orders.length
                  }
                </strong>
              </p>

              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>

                    {customerHistory.orders.map(
                      (order) => (

                        <tr key={order.id}>

                          <td>
                            <strong>
                              {
                                order.order_number
                              }
                            </strong>
                          </td>

                          <td>
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
                          </td>

                          <td>
                            {order.currency ===
                            'USD'
                              ? '$'
                              : `${order.currency} `}

                            {Number(
                              order.total,
                            ).toFixed(2)}
                          </td>

                          <td>
                            <span
                              className={`order-status ${order.payment_status}`}
                            >
                              {
                                order.payment_status
                              }
                            </span>
                          </td>

                          <td>
                            <span
                              className={`order-status ${order.status}`}
                            >
                              {
                                order.status
                              }
                            </span>
                          </td>

                        </tr>
                      ),
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}

function OrderStatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Package;
}) {
  return (
    <article className="stat-card">

      <span className="admin-order-stat-icon">
        <Icon size={22} />
      </span>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>

    </article>
  );
}