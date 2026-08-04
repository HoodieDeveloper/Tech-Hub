import { useEffect, useState } from 'react';
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Users,
} from 'lucide-react';
import { apiGet, type AuthUser } from '../../core/api/client';
import { ProductListPage } from '../products/ProductListPage';
import { AdminUsersPage } from './users/AdminUsersPage';
type AdminSection =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'stock'
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
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'stock', label: 'Stock', icon: Boxes },
  { key: 'vendors', label: 'Vendors', icon: Store },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'ratings', label: 'Ratings', icon: Star },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export function AdminDashboard({ user, onStorefront, onLogout }: Props) {
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<DashboardStats>('/admin/dashboard')
      .then(setStats)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
      });
  }, []);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Package size={27} />
          <span><strong>TechHub</strong><small>Admin Console</small></span>
        </div>

        <nav>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.key}
                className={section === item.key ? 'active' : ''}
                onClick={() => setSection(item.key)}
              >
                <Icon size={18} /> {item.label}
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" onClick={onStorefront}>View customer store</button>
          <button type="button" onClick={onLogout}><LogOut size={17} /> Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>{navigation.find((item) => item.key === section)?.label}</h1>
            <p>Signed in as {user.name} · administrator</p>
          </div>
        </header>

        {error && <div className="alert error">{error}</div>}

        {section === 'dashboard' && (
          <section>
            <div className="stat-grid">
              <StatCard label="All products" value={stats?.products} />
              <StatCard label="Active products" value={stats?.active_products} />
              <StatCard label="Out of stock" value={stats?.out_of_stock_products} />
              <StatCard label="Customers" value={stats?.customers} />
            </div>
            <div className="admin-info-card">
              <h2>Production control</h2>
              <p>
                Product changes made here use the authenticated Railway Laravel API and
                are saved in the connected Supabase database and Storage bucket.
              </p>
            </div>
          </section>
        )}

        {section === 'products' && <ProductListPage />}
        {section === 'users' && <AdminUsersPage />}

        {section !== 'dashboard' &&
            section !== 'products' &&
            section !== 'users' && (
          <section className="placeholder-page">
            <h2>{navigation.find((item) => item.key === section)?.label}</h2>
            <p>
              The role protection and page location are ready. Your team can build this
              feature inside <code>src/features/admin/{section}/</code>.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value ?? '—'}</strong>
    </article>
  );
}
