import {
  useEffect,
  useRef,
  useState,
} from 'react';

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

/*
 * =========================================
 * CACHE
 * =========================================
 */

const ORDERS_CACHE_PREFIX =
  'techhub_admin_orders_cache:';

const ORDERS_UI_CACHE_KEY =
  'techhub_admin_orders_ui';

const ORDER_HISTORY_CACHE_PREFIX =
  'techhub_admin_order_history:';

/*
 * =========================================
 * TYPES
 * =========================================
 */

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

  items?: OrderItem[];
};

type OrderSummary = {
  total: number;
  pending: number;
  confirmed: number;
  preparing: number;
  shipped: number;
  completed: number;
  cancelled: number;
};

type OrderPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

type OrdersResponse = {
  orders: AdminOrder[];
  summary: OrderSummary;
  pagination: OrderPagination;
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

type OrdersUiState = {
  currentPage: number;
  search: string;
};

/*
 * =========================================
 * CACHE HELPERS
 * =========================================
 */

function getOrdersCache(
  page: number,
): OrdersResponse | null {
  try {
    const raw =
      sessionStorage.getItem(
        `${ORDERS_CACHE_PREFIX}${page}`,
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(
      raw,
    ) as OrdersResponse;
  } catch {
    return null;
  }
}

function saveOrdersCache(
  page: number,
  data: OrdersResponse,
) {
  sessionStorage.setItem(
    `${ORDERS_CACHE_PREFIX}${page}`,
    JSON.stringify(
      data,
    ),
  );
}

function clearOrdersCache() {
  const keys: string[] = [];

  for (
    let index = 0;
    index < sessionStorage.length;
    index += 1
  ) {
    const key =
      sessionStorage.key(
        index,
      );

    if (
      key?.startsWith(
        ORDERS_CACHE_PREFIX,
      )
    ) {
      keys.push(key);
    }
  }

  keys.forEach(
    (key) => {
      sessionStorage.removeItem(
        key,
      );
    },
  );
}

function readOrdersUi(): OrdersUiState {
  try {
    const raw =
      sessionStorage.getItem(
        ORDERS_UI_CACHE_KEY,
      );

    if (!raw) {
      throw new Error();
    }

    const parsed =
      JSON.parse(
        raw,
      ) as OrdersUiState;

    return {
      currentPage:
        parsed.currentPage || 1,

      search:
        parsed.search || '',
    };
  } catch {
    return {
      currentPage: 1,
      search: '',
    };
  }
}

function saveOrdersUi(
  state: OrdersUiState,
) {
  sessionStorage.setItem(
    ORDERS_UI_CACHE_KEY,
    JSON.stringify(
      state,
    ),
  );
}

function getHistoryCache(
  userId: number,
): CustomerHistoryResponse | null {
  try {
    const raw =
      sessionStorage.getItem(
        `${ORDER_HISTORY_CACHE_PREFIX}${userId}`,
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(
      raw,
    ) as CustomerHistoryResponse;
  } catch {
    return null;
  }
}

function saveHistoryCache(
  userId: number,
  history: CustomerHistoryResponse,
) {
  sessionStorage.setItem(
    `${ORDER_HISTORY_CACHE_PREFIX}${userId}`,
    JSON.stringify(
      history,
    ),
  );
}

function clearHistoryCache(
  userId: number,
) {
  sessionStorage.removeItem(
    `${ORDER_HISTORY_CACHE_PREFIX}${userId}`,
  );
}

/*
 * =========================================
 * SEARCH
 * =========================================
 */

function getOrderProductSearchText(
  order: AdminOrder,
) {
  return (
    order.items ?? []
  )
    .map(
      (item) =>
        item.product_name,
    )
    .join(' ')
    .toLowerCase();
}

/*
 * =========================================
 * PAGE
 * =========================================
 */

export function AdminOrdersPage() {
  const initialUi =
    useRef(
      readOrdersUi(),
    ).current;

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(
      initialUi.currentPage,
    );

  const initialCache =
    useRef(
      getOrdersCache(
        initialUi.currentPage,
      ),
    ).current;

  const [
    data,
    setData,
  ] =
    useState<OrdersResponse | null>(
      initialCache,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      initialCache === null,
    );

  const [
    error,
    setError,
  ] =
    useState('');

  const [
    search,
    setSearch,
  ] =
    useState(
      initialUi.search,
    );

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    updatingPaymentId,
    setUpdatingPaymentId,
  ] =
    useState<number | null>(
      null,
    );

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
  ] =
    useState(false);

  const skipInitialFetch =
    useRef(
      initialCache !== null,
    );

  /*
   * =========================================
   * SAVE UI STATE
   * =========================================
   */

  useEffect(() => {
    saveOrdersUi({
      currentPage,
      search,
    });
  }, [
    currentPage,
    search,
  ]);

  /*
   * =========================================
   * LOAD ORDERS
   * =========================================
   */

  async function loadOrders(
    page = currentPage,
    force = false,
  ) {
    if (!force) {
      const cached =
        getOrdersCache(
          page,
        );

      if (cached) {
        setData(
          cached,
        );

        setLoading(
          false,
        );

        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response =
        await apiGet<OrdersResponse>(
          `/admin/orders?page=${page}`,
        );

      setData(
        response,
      );

      setCurrentPage(
        response.pagination
          .current_page,
      );

      saveOrdersCache(
        response.pagination
          .current_page,
        response,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load orders.',
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  /*
   * =========================================
   * PAGE CHANGE
   * =========================================
   */

  useEffect(() => {
    if (
      skipInitialFetch.current
    ) {
      skipInitialFetch.current =
        false;

      return;
    }

    void loadOrders(
      currentPage,
    );
  }, [currentPage]);

  function changePage(
    page: number,
  ) {
    if (
      page < 1 ||
      page >
        (data?.pagination
          .last_page ?? 1) ||
      page === currentPage
    ) {
      return;
    }

    setCurrentPage(
      page,
    );
  }

  function getPageNumbers() {
    const lastPage =
      data?.pagination
        .last_page ?? 1;

    const pages: number[] =
      [];

    let startPage =
      Math.max(
        1,
        currentPage - 2,
      );

    const endPage =
      Math.min(
        lastPage,
        startPage + 4,
      );

    if (
      endPage -
        startPage <
      4
    ) {
      startPage =
        Math.max(
          1,
          endPage - 4,
        );
    }

    for (
      let page =
        startPage;
      page <= endPage;
      page += 1
    ) {
      pages.push(
        page,
      );
    }

    return pages;
  }

  /*
   * =========================================
   * DELIVERY STATUS
   * =========================================
   */

  async function updateOrderStatus(
    orderId: number,
    status: OrderStatus,
  ) {
    setUpdatingOrderId(
      orderId,
    );

    const userId =
      data?.orders.find(
        (order) =>
          order.id === orderId,
      )?.user_id;

    try {
      const response =
        await apiPatch<UpdateOrderResponse>(
          `/admin/orders/${orderId}/status`,
          {
            status,
          },
        );

      setData((current) => {
        if (!current) {
          return current;
        }

        const previousOrder =
          current.orders.find(
            (order) =>
              order.id ===
              orderId,
          );

        const summary = {
          ...current.summary,
        };

        if (
          previousOrder &&
          previousOrder.status !==
            response.order.status
        ) {
          summary[
            previousOrder.status
          ] = Math.max(
            0,
            summary[
              previousOrder.status
            ] - 1,
          );

          summary[
            response.order.status
          ] += 1;
        }

        const updatedData: OrdersResponse =
          {
            ...current,

            summary,

            orders:
              current.orders.map(
                (order) => {
                  if (
                    order.id !==
                    orderId
                  ) {
                    return order;
                  }

                  return {
                    ...order,
                    ...response.order,

                    items:
                      response.order
                        .items ??
                      order.items,
                  };
                },
              ),
          };

        /*
         * Database changed.
         *
         * Keep current page cached,
         * but remove other pages so
         * stale summaries aren't reused.
         */
        clearOrdersCache();

        saveOrdersCache(
          currentPage,
          updatedData,
        );

        return updatedData;
      });

      if (
        userId !== undefined
      ) {
        clearHistoryCache(
          userId,
        );
      }
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : 'Unable to update order status.',
      );
    } finally {
      setUpdatingOrderId(
        null,
      );
    }
  }

  /*
   * =========================================
   * PAYMENT STATUS
   * =========================================
   */

  async function updatePaymentStatus(
    orderId: number,
    paymentStatus: PaymentStatus,
  ) {
    setUpdatingPaymentId(
      orderId,
    );

    const userId =
      data?.orders.find(
        (order) =>
          order.id === orderId,
      )?.user_id;

    try {
      const response =
        await apiPatch<UpdateOrderResponse>(
          `/admin/orders/${orderId}/payment-status`,
          {
            payment_status:
              paymentStatus,
          },
        );

      setData((current) => {
        if (!current) {
          return current;
        }

        const updatedData: OrdersResponse =
          {
            ...current,

            orders:
              current.orders.map(
                (order) => {
                  if (
                    order.id !==
                    orderId
                  ) {
                    return order;
                  }

                  return {
                    ...order,
                    ...response.order,

                    items:
                      response.order
                        .items ??
                      order.items,
                  };
                },
              ),
          };

        clearOrdersCache();

        saveOrdersCache(
          currentPage,
          updatedData,
        );

        return updatedData;
      });

      if (
        userId !== undefined
      ) {
        clearHistoryCache(
          userId,
        );
      }
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : 'Unable to update payment status.',
      );
    } finally {
      setUpdatingPaymentId(
        null,
      );
    }
  }

  /*
   * =========================================
   * CUSTOMER HISTORY
   * =========================================
   */

  async function viewCustomerHistory(
    userId: number,
  ) {
    const cached =
      getHistoryCache(
        userId,
      );

    if (cached) {
      setCustomerHistory(
        cached,
      );

      return;
    }

    setHistoryLoading(
      true,
    );

    try {
      const history =
        await apiGet<CustomerHistoryResponse>(
          `/admin/customers/${userId}/orders`,
        );

      setCustomerHistory(
        history,
      );

      saveHistoryCache(
        userId,
        history,
      );
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : 'Unable to load order history.',
      );
    } finally {
      setHistoryLoading(
        false,
      );
    }
  }

  function closeHistory() {
    setCustomerHistory(
      null,
    );
  }

  /*
   * =========================================
   * REFRESH
   * =========================================
   */

  async function refreshOrders() {
    clearOrdersCache();

    await loadOrders(
      currentPage,
      true,
    );
  }

  /*
   * =========================================
   * FILTER
   * =========================================
   */

  const filteredOrders =
    data?.orders.filter(
      (order) => {
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
            .includes(keyword) ||
          getOrderProductSearchText(
            order,
          ).includes(keyword)
        );
      },
    ) ?? [];

  /*
   * =========================================
   * LOADING
   * =========================================
   */

  if (
    loading &&
    !data
  ) {
    return (
      <section className="admin-info-card">
        <p>
          Loading orders...
        </p>
      </section>
    );
  }

  if (
    error &&
    !data
  ) {
    return (
      <section className="admin-info-card">
        <div className="alert error">
          {error}
        </div>

        <button
          type="button"
          onClick={() =>
            void loadOrders(
              currentPage,
              true,
            )
          }
        >
          Try again
        </button>
      </section>
    );
  }

  /*
   * =========================================
   * PAGE
   * =========================================
   */

  return (
    <>
          <section className="admin-orders-page">

      <div className="admin-page-heading">
        <h1>Order Management</h1>

        <p>
          Track and manage customer orders,
          payments, and delivery status.
        </p>
      </div>
        
        <div className="stat-grid">
          <OrderStatCard
            label="Pending Orders"
            value={
              data?.summary
                .pending ?? 0
            }
            icon={Clock3}
          />

          <OrderStatCard
            label="Processing Orders"
            value={
              (data?.summary
                .confirmed ?? 0) +
              (data?.summary
                .preparing ?? 0) +
              (data?.summary
                .shipped ?? 0)
            }
            icon={RefreshCw}
          />

          <OrderStatCard
            label="Completed Orders"
            value={
              data?.summary
                .completed ?? 0
            }
            icon={
              CheckCircle2
            }
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
              onClick={() =>
                void refreshOrders()
              }
              disabled={
                loading
              }
            >
              <RefreshCw
                size={17}
              />

              {loading
                ? 'Loading...'
                : 'Refresh'}
            </button>
          </div>

          <div className="orders-search-box">
            <Search
              size={18}
            />

            <input
              type="text"
              placeholder="Search current page..."
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
            />
          </div>

          {filteredOrders.length ===
          0 ? (
            <div className="admin-orders-empty">
              <Package
                size={40}
              />

              <p>
                No matching orders
                found.
              </p>
            </div>
          ) : (
            <>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>
                        Order ID
                      </th>

                      <th>
                        Customer
                      </th>

                      <th>
                        Product
                      </th>

                      <th>
                        Date
                      </th>

                      <th>
                        Amount
                      </th>

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
                      (
                        order,
                      ) => (
                        <tr
                          key={
                            order.id
                          }
                        >
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
                            <OrderProducts
                              order={
                                order
                              }
                            />
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
                            ).toFixed(
                              2,
                            )}
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
                                void updatePaymentStatus(
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
                                void updateOrderStatus(
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
                                void viewCustomerHistory(
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

              {/* PAGINATION */}

              <div className="products-pagination">
                <div className="products-pagination-info">
                  Showing{' '}
                  {data?.pagination
                    .from ?? 0}
                  {' - '}
                  {data?.pagination
                    .to ?? 0}
                  {' of '}
                  {data?.pagination
                    .total ?? 0}
                  {' orders'}
                </div>

                <div className="products-pagination-buttons">
                  <button
                    type="button"
                    onClick={() =>
                      changePage(
                        currentPage -
                          1,
                      )
                    }
                    disabled={
                      currentPage ===
                        1 ||
                      loading
                    }
                  >
                    ← Previous
                  </button>

                  {getPageNumbers().map(
                    (
                      page,
                    ) => (
                      <button
                        type="button"
                        key={
                          page
                        }
                        className={
                          page ===
                          currentPage
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          changePage(
                            page,
                          )
                        }
                        disabled={
                          loading
                        }
                      >
                        {
                          page
                        }
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      changePage(
                        currentPage +
                          1,
                      )
                    }
                    disabled={
                      currentPage ===
                        (data
                          ?.pagination
                          .last_page ??
                          1) ||
                      loading
                    }
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {customerHistory && (
        <div
          className="order-history-overlay"
          onClick={
            closeHistory
          }
        >
          <div
            className="order-history-modal"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div className="order-history-header">
              <div>
                <h2>
                  Customer Order
                  History
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
                onClick={
                  closeHistory
                }
              >
                <X
                  size={20}
                />
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
                      <th>
                        Order ID
                      </th>

                      <th>
                        Product
                      </th>

                      <th>
                        Date
                      </th>

                      <th>
                        Amount
                      </th>

                      <th>
                        Payment
                      </th>

                      <th>
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {customerHistory.orders.map(
                      (
                        order,
                      ) => (
                        <tr
                          key={
                            order.id
                          }
                        >
                          <td>
                            <strong>
                              {
                                order.order_number
                              }
                            </strong>
                          </td>

                          <td>
                            <OrderProducts
                              order={
                                order
                              }
                            />
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
                            ).toFixed(
                              2,
                            )}
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

/*
 * =========================================
 * PRODUCT NAMES
 * =========================================
 */

function OrderProducts({
  order,
}: {
  order: AdminOrder;
}) {
  const items =
    order.items ?? [];

  if (
    items.length === 0
  ) {
    return (
      <span className="order-product-empty">
        —
      </span>
    );
  }

  return (
    <div className="order-products-cell">
      {items.map(
        (item) => (
          <div
            key={
              item.id
            }
            className="order-product-line"
          >
            <strong>
              {
                item.product_name
              }
            </strong>

            <small>
              ×{' '}
              {
                item.quantity
              }
            </small>
          </div>
        ),
      )}
    </div>
  );
}

/*
 * =========================================
 * STAT CARD
 * =========================================
 */

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
        <Icon
          size={22}
        />
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