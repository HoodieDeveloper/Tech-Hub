import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  FileSpreadsheet,
  PackageCheck,
  Printer,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Warehouse,
} from 'lucide-react';

import {
  apiGet,
} from '../../../core/api/client';

import './ReportsPage.css';

type ReportMode =
  | 'daily'
  | 'monthly';

type ReportOrderItem = {
  id: number;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
};

type ReportOrder = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  total: string;
  currency: string;
  created_at: string;
  items: ReportOrderItem[];
};

type ReportProduct = {
  product_id: number | null;
  product_name: string;
  quantity: number;
  revenue: number;
  current_stock: number | null;
};

type TrendPoint = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};

type ReportResponse = {
  period: {
    mode: ReportMode;
    label: string;
    start: string;
    end: string;
  };

  summary: {
    revenue: number;
    orders: number;
    items_sold: number;
    average_order: number;
  };

  products: ReportProduct[];
  orders: ReportOrder[];
  trend: TrendPoint[];
};

type CacheValue = {
  savedAt: number;
  data: ReportResponse;
};

const REPORT_CACHE_PREFIX =
  'techhub_admin_sales_report:';

const REPORT_CACHE_MS =
  5 * 60 * 1000;

function pad(
  value: number,
) {
  return String(value).padStart(
    2,
    '0',
  );
}

function toDateKey(
  date: Date,
) {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}`;
}

function toMonthKey(
  date: Date,
) {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}`;
}

function formatMoney(
  value: number,
) {
  return `$${value.toFixed(2)}`;
}

function escapeHtml(
  value: unknown,
) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cacheKey(
  mode: ReportMode,
  selectedDate: string,
  selectedMonth: string,
) {
  const period =
    mode === 'daily'
      ? selectedDate
      : selectedMonth;

  return `${REPORT_CACHE_PREFIX}${mode}:${period}`;
}

function readCache(
  key: string,
): ReportResponse | null {
  try {
    const raw =
      sessionStorage.getItem(
        key,
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(
        raw,
      ) as CacheValue;

    if (
      Date.now() -
        parsed.savedAt >
      REPORT_CACHE_MS
    ) {
      sessionStorage.removeItem(
        key,
      );
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function saveCache(
  key: string,
  data: ReportResponse,
) {
  sessionStorage.setItem(
    key,
    JSON.stringify({
      savedAt: Date.now(),
      data,
    } satisfies CacheValue),
  );
}

export function AdminReportsPage() {
  const today =
    new Date();

  const [
    mode,
    setMode,
  ] = useState<ReportMode>(
    'daily',
  );

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    toDateKey(today),
  );

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    toMonthKey(today),
  );

  const [
    data,
    setData,
  ] = useState<ReportResponse | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const requestPath =
    useMemo(
      () => {
        const params =
          new URLSearchParams();

        params.set(
          'mode',
          mode,
        );

        if (
          mode === 'daily'
        ) {
          params.set(
            'date',
            selectedDate,
          );
        } else {
          params.set(
            'month',
            selectedMonth,
          );
        }

        return `/admin/reports/sales?${params.toString()}`;
      },
      [
        mode,
        selectedDate,
        selectedMonth,
      ],
    );

  async function loadReport(
    force = false,
  ) {
    const key =
      cacheKey(
        mode,
        selectedDate,
        selectedMonth,
      );

    if (!force) {
      const cached =
        readCache(key);

      if (cached) {
        setData(cached);
        setLoading(false);
        setError('');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response =
        await apiGet<ReportResponse>(
          requestPath,
        );

      setData(response);
      saveCache(
        key,
        response,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load the sales report.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReport();
  }, [requestPath]);

  const maxTrendRevenue =
    Math.max(
      1,
      ...(data?.trend ?? []).map(
        (point) =>
          point.revenue,
      ),
    );

  const maxProductQuantity =
    Math.max(
      1,
      ...(data?.products ?? []).map(
        (product) =>
          product.quantity,
      ),
    );

  function exportExcel() {
    if (!data) {
      return;
    }

    const soldRows =
      data.products
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row.product_name)}</td>
              <td>${row.quantity}</td>
              <td>${row.revenue.toFixed(2)}</td>
              <td>${row.current_stock ?? ''}</td>
            </tr>`,
        )
        .join('');

    const orderRows =
      data.orders
        .map(
          (order) => `
            <tr>
              <td>${escapeHtml(order.order_number)}</td>
              <td>${escapeHtml(new Date(order.created_at).toLocaleString())}</td>
              <td>${escapeHtml(order.customer_name)}</td>
              <td>${escapeHtml((order.items ?? []).map((item) => `${item.product_name} x${item.quantity}`).join(', '))}</td>
              <td>${Number(order.total).toFixed(2)}</td>
              <td>${escapeHtml(order.payment_status)}</td>
              <td>${escapeHtml(order.status)}</td>
            </tr>`,
        )
        .join('');

    const workbookHtml = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            table { border-collapse: collapse; margin-bottom: 24px; }
            th, td { border: 1px solid #999; padding: 7px 10px; }
            th { background: #eaf2fb; }
          </style>
        </head>
        <body>
          <h1>DCS Computer Shop Sales Report</h1>
          <p>Period: ${escapeHtml(data.period.label)}</p>

          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Sales</td><td>${data.summary.revenue.toFixed(2)}</td></tr>
            <tr><td>Orders</td><td>${data.summary.orders}</td></tr>
            <tr><td>Items Sold</td><td>${data.summary.items_sold}</td></tr>
            <tr><td>Average Order</td><td>${data.summary.average_order.toFixed(2)}</td></tr>
          </table>

          <h2>Sold Products</h2>
          <table>
            <tr><th>Product</th><th>Quantity Sold</th><th>Revenue</th><th>Current Stock</th></tr>
            ${soldRows}
          </table>

          <h2>Orders</h2>
          <table>
            <tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr>
            ${orderRows}
          </table>
        </body>
      </html>`;

    const blob =
      new Blob(
        [workbookHtml],
        {
          type:
            'application/vnd.ms-excel;charset=utf-8',
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const link =
      document.createElement(
        'a',
      );

    link.href = url;
    link.download =
      `dcs-sales-${
        mode === 'daily'
          ? selectedDate
          : selectedMonth
      }.xls`;

    document.body.appendChild(
      link,
    );
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="admin-reports-page techhub-page-enter">
      <div className="admin-page-heading reports-page-heading">
        <div>
          <h1>
            Sales Reports
          </h1>
          <p>
            Query all sold items by day or month, review current stock and export the complete data.
          </p>
        </div>

        <div className="report-actions no-print">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              void loadReport(true)
            }
            disabled={loading}
          >
            <RefreshCw size={17} />
            {loading
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={exportExcel}
            disabled={
              loading ||
              !data ||
              data.orders.length === 0
            }
          >
            <FileSpreadsheet size={17} />
            Excel
          </button>

          <button
            type="button"
            onClick={() =>
              window.print()
            }
            disabled={
              loading ||
              !data ||
              data.orders.length === 0
            }
          >
            <Printer size={17} />
            Export A4 PDF
          </button>
        </div>
      </div>

      <section className="report-filter-card no-print">
        <div className="report-mode-switch">
          <button
            type="button"
            className={
              mode === 'daily'
                ? 'active'
                : ''
            }
            onClick={() =>
              setMode('daily')
            }
          >
            Daily
          </button>

          <button
            type="button"
            className={
              mode === 'monthly'
                ? 'active'
                : ''
            }
            onClick={() =>
              setMode('monthly')
            }
          >
            Monthly
          </button>
        </div>

        <label className="report-period-input">
          <CalendarDays size={17} />

          {mode === 'daily' ? (
            <input
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(
                  event.target.value,
                )
              }
            />
          ) : (
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(
                  event.target.value,
                )
              }
            />
          )}
        </label>

        <div className="report-current-period">
          <span>
            Report period
          </span>
          <strong>
            {data?.period.label ?? 'Loading...'}
          </strong>
        </div>
      </section>

      {error && (
        <div className="alert error no-print">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="report-loading-card">
          Loading sales report...
        </div>
      )}

      {data && (
        <>
          <div className="report-stat-grid no-print">
            <ReportStatCard
              icon={CircleDollarSign}
              label="Sales"
              value={formatMoney(data.summary.revenue)}
              note={data.period.label}
            />

            <ReportStatCard
              icon={ShoppingBag}
              label="Orders"
              value={String(data.summary.orders)}
              note="Non-cancelled purchases"
            />

            <ReportStatCard
              icon={PackageCheck}
              label="Items Sold"
              value={String(data.summary.items_sold)}
              note="Total product quantity"
            />

            <ReportStatCard
              icon={TrendingUp}
              label="Average Order"
              value={formatMoney(data.summary.average_order)}
              note="Average order value"
            />
          </div>

          {data.orders.length === 0 ? (
            <div className="report-empty">
              No purchases were found for this period.
            </div>
          ) : (
            <>
              <div className="report-analytics-grid no-print">
                <section className="report-card report-trend-card">
                  <div className="report-card-heading">
                    <div>
                      <h2>
                        Sales Analytics
                      </h2>
                      <p>
                        {mode === 'daily'
                          ? 'Revenue by hour for the selected day.'
                          : 'Revenue by day for the selected month.'}
                      </p>
                    </div>
                    <BarChart3 size={21} />
                  </div>

                  <div className="report-chart-scroll">
                    <div className={`report-bar-chart ${mode}`}>
                      {data.trend.map(
                        (point) => (
                          <div
                            className="report-bar-column"
                            key={point.key}
                          >
                            <span className="report-bar-value">
                              {point.revenue > 0
                                ? formatMoney(point.revenue)
                                : ''}
                            </span>

                            <div className="report-bar-track">
                              <div
                                className="report-bar-fill"
                                style={{
                                  height: `${Math.max(
                                    point.revenue > 0
                                      ? 5
                                      : 0,
                                    (point.revenue /
                                      maxTrendRevenue) *
                                      100,
                                  )}%`,
                                }}
                              />
                            </div>

                            <span className="report-bar-label">
                              {point.label}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </section>

                <section className="report-card">
                  <div className="report-card-heading">
                    <div>
                      <h2>
                        Top Sold Products
                      </h2>
                      <p>
                        Highest quantity sold in this report period.
                      </p>
                    </div>
                    <TrendingUp size={21} />
                  </div>

                  <div className="report-top-products">
                    {data.products
                      .slice(0, 6)
                      .map(
                        (product, index) => (
                          <div key={`${product.product_id}-${product.product_name}`}>
                            <div className="report-top-product-title">
                              <span>
                                {index + 1}
                              </span>
                              <div>
                                <strong>
                                  {product.product_name}
                                </strong>
                                <small>
                                  {product.quantity} sold · {formatMoney(product.revenue)} · {product.current_stock ?? '—'} in stock
                                </small>
                              </div>
                            </div>

                            <div className="report-product-progress">
                              <div
                                style={{
                                  width: `${Math.max(
                                    5,
                                    (product.quantity /
                                      maxProductQuantity) *
                                      100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ),
                      )}
                  </div>
                </section>
              </div>

              <section className="report-card report-table-card no-print">
                <div className="report-card-heading">
                  <div>
                    <h2>
                      Sold Product Summary
                    </h2>
                    <p>
                      Quantity sold, revenue and the product's current shop stock.
                    </p>
                  </div>
                  <Warehouse size={21} />
                </div>

                <div className="report-table-wrapper">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty Sold</th>
                        <th>Revenue</th>
                        <th>Current Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.products.map(
                        (product) => (
                          <tr key={`${product.product_id}-${product.product_name}`}>
                            <td>
                              {product.product_name}
                            </td>
                            <td>
                              {product.quantity}
                            </td>
                            <td>
                              {formatMoney(product.revenue)}
                            </td>
                            <td>
                              {product.current_stock ?? 'Deleted product'}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="report-card report-table-card no-print">
                <div className="report-card-heading">
                  <div>
                    <h2>
                      Purchase Details
                    </h2>
                    <p>
                      Every purchase included in the selected report period.
                    </p>
                  </div>
                  <ShoppingBag size={21} />
                </div>

                <div className="report-table-wrapper">
                  <table className="report-table report-order-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.orders.map(
                        (order) => (
                          <tr key={order.id}>
                            <td>
                              <strong>
                                {order.order_number}
                              </strong>
                            </td>
                            <td>
                              {new Date(order.created_at).toLocaleString()}
                            </td>
                            <td>
                              <strong>
                                {order.customer_name}
                              </strong>
                              <span className="report-customer-email">
                                {order.customer_email}
                              </span>
                            </td>
                            <td>
                              <div className="report-order-items">
                                {order.items.map(
                                  (item) => (
                                    <span key={item.id}>
                                      {item.product_name} × {item.quantity}
                                    </span>
                                  ),
                                )}
                              </div>
                            </td>
                            <td>
                              ${Number(order.total).toFixed(2)}
                            </td>
                            <td>
                              <span className={`report-status ${order.payment_status}`}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td>
                              <span className={`report-status ${order.status}`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/*
                PRINT ONLY:
                The PDF intentionally contains only dense report data,
                not the admin sidebar, buttons or analytics charts.
              */}
              <section className="report-a4-print print-only">
                <header className="report-a4-header">
                  <h1>
                    DCS Computer Shop Sales Report
                  </h1>
                  <p>
                    {data.period.label}
                  </p>
                </header>

                <table className="report-a4-summary">
                  <tbody>
                    <tr>
                      <th>Sales</th>
                      <td>
                        {formatMoney(data.summary.revenue)}
                      </td>
                      <th>Orders</th>
                      <td>
                        {data.summary.orders}
                      </td>
                    </tr>
                    <tr>
                      <th>Items Sold</th>
                      <td>
                        {data.summary.items_sold}
                      </td>
                      <th>Average Order</th>
                      <td>
                        {formatMoney(data.summary.average_order)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <h2>
                  Sold Products / Stock
                </h2>

                <table className="report-a4-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Sold</th>
                      <th>Revenue</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.map(
                      (product) => (
                        <tr key={`print-product-${product.product_id}-${product.product_name}`}>
                          <td>
                            {product.product_name}
                          </td>
                          <td>
                            {product.quantity}
                          </td>
                          <td>
                            {formatMoney(product.revenue)}
                          </td>
                          <td>
                            {product.current_stock ?? '—'}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>

                <h2>
                  All Purchases
                </h2>

                <table className="report-a4-table report-a4-orders">
                  <thead>
                    <tr>
                      <th>Order / Date</th>
                      <th>Customer</th>
                      <th>Purchased Items</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.map(
                      (order) => (
                        <tr key={`print-order-${order.id}`}>
                          <td>
                            <strong>
                              {order.order_number}
                            </strong>
                            <br />
                            {new Date(order.created_at).toLocaleString()}
                          </td>
                          <td>
                            {order.customer_name}
                            <br />
                            {order.customer_email}
                          </td>
                          <td>
                            {order.items.map(
                              (item) => (
                                <div key={`print-item-${item.id}`}>
                                  {item.product_name} × {item.quantity}
                                </div>
                              ),
                            )}
                          </td>
                          <td>
                            ${Number(order.total).toFixed(2)}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>

                <footer className="report-a4-footer">
                  Generated from TechHub / DCS Computer Shop admin reports.
                </footer>
              </section>
            </>
          )}
        </>
      )}
    </section>
  );
}

function ReportStatCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof ShoppingBag;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="report-stat-card">
      <span className="report-stat-icon">
        <Icon size={21} />
      </span>

      <div>
        <span>
          {label}
        </span>
        <strong>
          {value}
        </strong>
        <small>
          {note}
        </small>
      </div>
    </article>
  );
}
