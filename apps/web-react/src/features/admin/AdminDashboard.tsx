import { useEffect, useState } from 'react';

import {
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Users,
} from 'lucide-react';

import {
  apiGet,
  type AuthUser,
} from '../../core/api/client';

import { AdminProductsPage } from './products/AdminProductsPage';
import { AdminOrdersPage } from './orders/AdminOrdersPage';
import { AdminRatingsPage } from './ratings/AdminRatingsPage';
import { AdminReportsPage } from './reports/AdminReportsPage';
import { AdminSettingsPage } from './settings/AdminSettingsPage';
import { AdminUsersPage } from './users/AdminUsersPage';
import { AdminVendorsPage } from './vendors/AdminVendorsPage';

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

type DashboardStats = {
  products: number;
  active_products: number;
  out_of_stock_products: number;
  customers: number;
  admins: number;
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
  const [section, setSection] =
    useState<AdminSection>('dashboard');

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [storeLogo, setStoreLogo] =
    useState<string | null>(null);

  const [error, setError] =
    useState('');

  /*
   * Load dashboard statistics.
   */
  useEffect(() => {
    apiGet<DashboardStats>(
      '/admin/dashboard',
    )
      .then(setStats)
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load dashboard.',
        );
      });
  }, []);

  /*
   * Load the shop logo from Website Settings.
   */
  useEffect(() => {
    apiGet<SettingsResponse>(
      '/admin/settings',
    )
      .then((response) => {
        setStoreLogo(
          response.settings.logo_url,
        );
      })
      .catch((err: unknown) => {
        console.error(
          'Unable to load store logo:',
          err,
        );
      });
  }, []);

  /*
   * Listen for logo changes from the Settings page.
   * We will use this so the sidebar can update
   * immediately after the boss changes the logo.
   */
  useEffect(() => {
    function handleLogoUpdated(
      event: Event,
    ) {
      const logoEvent =
        event as CustomEvent<{
          logoUrl: string | null;
        }>;

      setStoreLogo(
        logoEvent.detail?.logoUrl ??
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
      <aside className="admin-sidebar">
        {/* Dynamic Shop Logo */}

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
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.key}
                title={
                  sidebarOpen
                    ? undefined
                    : item.label
                }
                className={
                  section === item.key
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setSection(item.key)
                }
              >
                <Icon size={19} />

                <span className="admin-nav-label">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            title={
              sidebarOpen
                ? undefined
                : 'View customer store'
            }
            onClick={onStorefront}
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
            onClick={onLogout}
          >
            <LogOut size={18} />

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
                (current) => !current,
              )
            }
          >
            <ChevronRight size={20} />

            <span className="admin-nav-label">
              {sidebarOpen
                ? 'Collapse'
                : 'Expand'}
            </span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {section === 'dashboard' && (
          <DashboardHome
            stats={stats}
          />
        )}

        {section === 'products' && (
          <AdminProductsPage />
        )}

        {section === 'orders' && (
          <AdminOrdersPage />
        )}

        {section === 'vendors' && (
          <AdminVendorsPage />
        )}

        {section === 'users' && (
          <AdminUsersPage />
        )}

        {section === 'reports' && (
          <AdminReportsPage />
        )}

        {section === 'ratings' && (
          <AdminRatingsPage />
        )}

        {section === 'settings' && (
          <AdminSettingsPage />
        )}
      </main>
    </div>
  );
}

function DashboardHome({
  stats,
}: {
  stats: DashboardStats | null;
}) {
  return (
    <section className="admin-dashboard-home">
      <div className="admin-page-heading">
        <h1>Dashboard</h1>

        <p>
          Overview of your TechHub
          store.
        </p>
      </div>

      <div className="admin-stats-grid">
        <StatCard
          label="Products"
          value={stats?.products}
        />

        <StatCard
          label="Active products"
          value={
            stats?.active_products
          }
        />

        <StatCard
          label="Out of stock"
          value={
            stats?.out_of_stock_products
          }
        />

        <StatCard
          label="Customers"
          value={stats?.customers}
        />
      </div>

      <div className="admin-info-card">
        <h2>Production control</h2>

        <p>
          Product changes use the
          authenticated Laravel API and
          are saved in the connected
          Supabase database and Storage
          bucket.
        </p>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value?: number;
}) {
  return (
    <article className="admin-stat-card">
      <span>{label}</span>

      <strong>
        {value ?? '—'}
      </strong>
    </article>
  );
}