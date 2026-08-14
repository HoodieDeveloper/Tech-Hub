import {
  useEffect,
  useState,
} from 'react';

import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  LogOut,
  Package,
  PackageCheck,
  Settings,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';

import {
  apiGet,
  type AuthUser,
} from '../../core/api/client';

import {
  AdminProductsPage,
} from './products/AdminProductsPage';

import {
  AdminOrdersPage,
} from './orders/AdminOrdersPage';

import {
  AdminRatingsPage,
} from './ratings/AdminRatingsPage';

import {
  AdminReportsPage,
} from './reports/AdminReportsPage';

import {
  AdminSettingsPage,
} from './settings/AdminSettingsPage';

import {
  AdminUsersPage,
} from './users/AdminUsersPage';

import {
  AdminVendorsPage,
} from './vendors/AdminVendorsPage';

import './AdminDashboard.css';

type AdminSection =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'vendors'
  | 'users'
  | 'reports'
  | 'ratings'
  | 'settings';

type BestSellingProduct = {
  product_id: number | null;
  product_name: string;
  quantity_sold: number;
  sales_total: string;
};

type DashboardStats = {
  products: number;
  active_products: number;
  out_of_stock_products: number;

  customers: number;
  admins: number;

  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;

  total_sales: string;
  today_orders: number;
  today_sales: string;

  items_sold: number;

  best_selling_products:
    BestSellingProduct[];
};

type SettingsResponse = {
  settings: {
    logo_url: string | null;
  };
};

type Props = {
  user: AuthUser;
  onStorefront: () => void;
  onLogout: () => void;
};

const navigation: Array<{
  key: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'products',
    label: 'Products',
    icon: Package,
  },
  {
    key: 'orders',
    label: 'Orders',
    icon: ShoppingBag,
  },
  {
    key: 'vendors',
    label: 'Vendors',
    icon: Store,
  },
  {
    key: 'users',
    label: 'Users',
    icon: Users,
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: BarChart3,
  },
  {
    key: 'ratings',
    label: 'Ratings',
    icon: Star,
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
  },
];

export function AdminDashboard({
  onStorefront,
  onLogout,
}: Props) {
  const [
    section,
    setSection,
  ] =
    useState<AdminSection>(
      'dashboard',
    );

  const [
    sidebarOpen,
    setSidebarOpen,
  ] =
    useState(false);

  const [
    stats,
    setStats,
  ] =
    useState<DashboardStats | null>(
      null,
    );

  const [
    storeLogo,
    setStoreLogo,
  ] =
    useState<string | null>(
      null,
    );

  const [
    dashboardLoading,
    setDashboardLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState('');

  /*
   * Load / refresh dashboard
   * analytics.
   */
  useEffect(() => {
    if (
      section !== 'dashboard'
    ) {
      return;
    }

    async function loadDashboard() {
      setDashboardLoading(
        true,
      );

      setError('');

      try {
        const response =
          await apiGet<DashboardStats>(
            '/admin/dashboard',
          );

        setStats(
          response,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load dashboard.',
        );
      } finally {
        setDashboardLoading(
          false,
        );
      }
    }

    void loadDashboard();
  }, [section]);

  /*
   * Load dynamic shop logo.
   */
  useEffect(() => {
    apiGet<SettingsResponse>(
      '/admin/settings',
    )
      .then(
        (response) => {
          setStoreLogo(
            response.settings
              .logo_url,
          );
        },
      )
      .catch(
        (err: unknown) => {
          console.error(
            'Unable to load store logo:',
            err,
          );
        },
      );
  }, []);

  /*
   * Update sidebar logo
   * immediately after Settings
   * changes it.
   */
  useEffect(() => {
    function handleLogoUpdated(
      event: Event,
    ) {
      const logoEvent =
        event as CustomEvent<{
          logoUrl:
            | string
            | null;
        }>;

      setStoreLogo(
        logoEvent.detail
          ?.logoUrl ??
          null,
      );
    }

    window.addEventListener(
      'techhub:logo-updated',
      handleLogoUpdated,
    );

    return () => {
      window.removeEventListener(
        'techhub:logo-updated',
        handleLogoUpdated,
      );
    };
  }, []);

  return (
    <div
      className={`admin-shell ${
        sidebarOpen
          ? 'sidebar-open'
          : 'sidebar-closed'
      }`}
    >
      {/* =====================
          SIDEBAR
      ====================== */}

      <aside className="admin-sidebar">
        <div className="admin-brand admin-logo-brand">
          {storeLogo && (
            <img
              src={storeLogo}
              alt="Shop logo"
              className="admin-sidebar-logo"
            />
          )}
        </div>

        <nav>
          {navigation.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <button
                  type="button"
                  key={
                    item.key
                  }
                  title={
                    sidebarOpen
                      ? undefined
                      : item.label
                  }
                  className={
                    section ===
                    item.key
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setSection(
                      item.key,
                    )
                  }
                >
                  <Icon
                    size={19}
                  />

                  <span className="admin-nav-label">
                    {
                      item.label
                    }
                  </span>
                </button>
              );
            },
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            title={
              sidebarOpen
                ? undefined
                : 'View customer store'
            }
            onClick={
              onStorefront
            }
          >
            <Store size={18} />

            <span className="admin-nav-label">
              View customer store
            </span>
          </button>

          <button
            type="button"
            title={
              sidebarOpen
                ? undefined
                : 'Logout'
            }
            onClick={
              onLogout
            }
          >
            <LogOut
              size={18}
            />

            <span className="admin-nav-label">
              Logout
            </span>
          </button>

          <button
            type="button"
            className="admin-sidebar-toggle"
            title={
              sidebarOpen
                ? 'Collapse sidebar'
                : 'Expand sidebar'
            }
            onClick={() =>
              setSidebarOpen(
                (
                  current,
                ) =>
                  !current,
              )
            }
          >
            <ChevronRight
              size={20}
            />

            <span className="admin-nav-label">
              {sidebarOpen
                ? 'Collapse'
                : 'Expand'}
            </span>
          </button>
        </div>
      </aside>

      {/* =====================
          CONTENT
      ====================== */}

      <main className="admin-main">
        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {section ===
          'dashboard' && (
          <DashboardHome
            stats={stats}
            loading={
              dashboardLoading
            }
          />
        )}

        {section ===
          'products' && (
          <AdminProductsPage />
        )}

        {section ===
          'orders' && (
          <AdminOrdersPage />
        )}

        {section ===
          'vendors' && (
          <AdminVendorsPage />
        )}

        {section ===
          'users' && (
          <AdminUsersPage />
        )}

        {section ===
          'reports' && (
          <AdminReportsPage />
        )}

        {section ===
          'ratings' && (
          <AdminRatingsPage />
        )}

        {section ===
          'settings' && (
          <AdminSettingsPage />
        )}
      </main>
    </div>
  );
}

/* =========================
   DASHBOARD HOME
========================= */

function DashboardHome({
  stats,
  loading,
}: {
  stats:
    | DashboardStats
    | null;

  loading: boolean;
}) {
  return (
    <section className="admin-dashboard-home">
      <div className="admin-page-heading">
        <div>
          <h1>
            Dashboard
          </h1>

          <p>
            Real-time overview
            of your store,
            orders and sales.
          </p>
        </div>
      </div>

      {loading &&
        !stats && (
          <div className="admin-dashboard-loading">
            Loading analytics...
          </div>
        )}

      {/* =====================
          SALES CARDS
      ====================== */}

      <div className="admin-stats-grid">
        <StatCard
          label="Total Sales"
          value={
            stats
              ? `$${Number(
                  stats.total_sales,
                ).toFixed(2)}`
              : undefined
          }
          icon={
            CircleDollarSign
          }
          description="All non-cancelled orders"
        />

        <StatCard
          label="Today's Sales"
          value={
            stats
              ? `$${Number(
                  stats.today_sales,
                ).toFixed(2)}`
              : undefined
          }
          icon={
            TrendingUp
          }
          description={`${stats?.today_orders ?? 0} orders today`}
        />

        <StatCard
          label="Total Orders"
          value={
            stats?.total_orders
          }
          icon={
            ShoppingBag
          }
          description={`${stats?.items_sold ?? 0} items sold`}
        />

        <StatCard
          label="Pending Orders"
          value={
            stats?.pending_orders
          }
          icon={Clock3}
          description="Waiting for processing"
        />
      </div>

      {/* =====================
          ORDER STATUS
      ====================== */}

      <div className="admin-stats-grid admin-secondary-stats">
        <StatCard
          label="Completed Orders"
          value={
            stats?.completed_orders
          }
          icon={
            CheckCircle2
          }
          description="Successfully completed"
        />

        <StatCard
          label="Cancelled Orders"
          value={
            stats?.cancelled_orders
          }
          icon={
            ShoppingBag
          }
          description="Cancelled orders"
        />

        <StatCard
          label="Products"
          value={
            stats?.products
          }
          icon={Package}
          description={`${stats?.active_products ?? 0} active products`}
        />

        <StatCard
          label="Customers"
          value={
            stats?.customers
          }
          icon={Users}
          description="Registered customers"
        />
      </div>

      {/* =====================
          LOWER ANALYTICS
      ====================== */}

      <div className="admin-dashboard-analytics-grid">
        {/* BEST SELLERS */}

        <section className="admin-analytics-card">
          <div className="admin-analytics-card-heading">
            <div>
              <h2>
                Best Selling
                Products
              </h2>

              <p>
                Based on real
                customer orders.
              </p>
            </div>

            <PackageCheck
              size={22}
            />
          </div>

          {!stats?.best_selling_products?.length ? (
            <div className="admin-analytics-empty">
              No sales data
              available yet.
            </div>
          ) : (
            <div className="admin-best-seller-list">
              {stats.best_selling_products.map(
                (
                  product,
                  index,
                ) => (
                  <div
                    className="admin-best-seller-row"
                    key={`${
                      product.product_id ??
                      product.product_name
                    }-${index}`}
                  >
                    <div className="admin-best-seller-rank">
                      {index +
                        1}
                    </div>

                    <div className="admin-best-seller-info">
                      <strong>
                        {
                          product.product_name
                        }
                      </strong>

                      <span>
                        {
                          product.quantity_sold
                        }{' '}
                        sold
                      </span>
                    </div>

                    <strong className="admin-best-seller-sales">
                      $
                      {Number(
                        product.sales_total,
                      ).toFixed(
                        2,
                      )}
                    </strong>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        {/* STORE SUMMARY */}

        <section className="admin-analytics-card">
          <div className="admin-analytics-card-heading">
            <div>
              <h2>
                Store Summary
              </h2>

              <p>
                Current inventory
                and sales status.
              </p>
            </div>

            <BarChart3
              size={22}
            />
          </div>

          <div className="admin-summary-list">
            <SummaryRow
              label="Active Products"
              value={
                stats?.active_products
              }
            />

            <SummaryRow
              label="Out of Stock"
              value={
                stats
                  ?.out_of_stock_products
              }
            />

            <SummaryRow
              label="Items Sold"
              value={
                stats?.items_sold
              }
            />

            <SummaryRow
              label="Admins"
              value={
                stats?.admins
              }
            />
          </div>
        </section>
      </div>
    </section>
  );
}

/* =========================
   STAT CARD
========================= */

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;

  value:
    | string
    | number
    | undefined;

  description: string;

  icon: typeof Package;
}) {
  return (
    <article className="admin-stat-card">
      <div className="admin-stat-card-top">
        <span>
          {label}
        </span>

        <div className="admin-stat-icon">
          <Icon
            size={20}
          />
        </div>
      </div>

      <strong>
        {value ?? '—'}
      </strong>

      <small>
        {description}
      </small>
    </article>
  );
}

/* =========================
   SUMMARY ROW
========================= */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value:
    | number
    | undefined;
}) {
  return (
    <div className="admin-summary-row">
      <span>
        {label}
      </span>

      <strong>
        {value ?? '—'}
      </strong>
    </div>
  );
}