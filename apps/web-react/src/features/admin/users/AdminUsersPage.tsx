import { useEffect, useState } from 'react';
import { apiGet } from '../../../core/api/client';

type UserRole = 'admin' | 'customer';

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
};

type UsersResponse = {
  users: AdminUser[];
  summary: {
    total: number;
    customers: number;
    admins: number;
  };
};

export function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadUsers() {
    setLoading(true);
    setError('');

    apiGet<UsersResponse>('/admin/users')
      .then(setData)
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : 'Unable to load users.',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <section className="admin-info-card">
        <p>Loading users...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-info-card">
        <div className="alert error">{error}</div>

        <button type="button" onClick={loadUsers}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section>
      <div className="stat-grid">
        <UserStatCard label="All users" value={data?.summary.total ?? 0} />

        <UserStatCard
          label="Customers"
          value={data?.summary.customers ?? 0}
        />

        <UserStatCard
          label="Administrators"
          value={data?.summary.admins ?? 0}
        />
      </div>

      <div className="admin-info-card">
        <div className="admin-users-header">
          <div>
            <h2>User accounts</h2>
            <p>View all customer and administrator accounts.</p>
          </div>

          <button type="button" onClick={loadUsers}>
            Refresh
          </button>
        </div>

        {data?.users.length === 0 ? (
          <p>No users were found.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered</th>
                </tr>
              </thead>

              <tbody>
                {data?.users.map((account) => (
                  <tr key={account.id}>
                    <td>{account.id}</td>
                    <td>{account.name}</td>
                    <td>{account.email}</td>
                    <td>
                      <span className={`role-badge ${account.role}`}>
                        {account.role}
                      </span>
                    </td>
                    <td>
                      {new Date(account.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function UserStatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}