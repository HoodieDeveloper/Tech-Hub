import { useEffect, useState } from 'react';
import {
  RefreshCw,
  UserRound,
  Users,
} from 'lucide-react';

import {
  apiGet,
  resolveMediaUrl,
} from '../../../core/api/client';
import './UsersPage.css';
type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: 'customer';
  avatar_url: string | null;
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
  const [data, setData] =
    useState<UsersResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  function loadUsers() {
    setLoading(true);
    setError('');

    apiGet<UsersResponse>(
      '/admin/users',
    )
      .then(setData)
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load customers.',
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
        <p>
          Loading customers...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-info-card">
        <div className="alert error">
          {error}
        </div>

        <button
          type="button"
          onClick={loadUsers}
        >
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="admin-users-page">
      <div className="stat-grid">
        <UserStatCard
          label="Total Customers"
          value={
            data?.summary.customers ??
            0
          }
          icon={Users}
        />
      </div>

      <div className="admin-info-card">
        <div className="admin-users-header">
          <div>
            <h2>
              Customer Accounts
            </h2>

            <p>
              View registered customer
              accounts and profile
              information.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {data?.users.length ===
        0 ? (
          <div className="admin-users-empty">
            <UserRound
              size={40}
            />

            <p>
              No customer accounts
              were found.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    Customer
                  </th>

                  <th>Email</th>

                  <th>Role</th>

                  <th>
                    Registered
                  </th>
                </tr>
              </thead>

              <tbody>
                {data?.users.map(
                  (account) => {
                    const accountAvatarUrl =
                      resolveMediaUrl(
                        account.avatar_url,
                      );

                    return (
                    <tr
                      key={
                        account.id
                      }
                    >
                      <td>
                        <div className="admin-user-identity">
                          <div className="admin-user-avatar">
                            {accountAvatarUrl ? (
                              <img
                                src={
                                  accountAvatarUrl
                                }
                                alt={`${account.name} profile`}
                              />
                            ) : (
                              <UserRound
                                size={
                                  25
                                }
                              />
                            )}
                          </div>

                          <div className="admin-user-details">
                            <strong>
                              {
                                account.name
                              }
                            </strong>

                            <span>
                              Customer #
                              {
                                account.id
                              }
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {
                          account.email
                        }
                      </td>

                      <td>
                        <span className="role-badge customer">
                          Customer
                        </span>
                      </td>

                      <td>
                        {new Date(
                          account.created_at,
                        ).toLocaleDateString(
                          undefined,
                          {
                            year: 'numeric',
                            month:
                              'short',
                            day: 'numeric',
                          },
                        )}
                      </td>
                    </tr>
                    );
                  },
                )}
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
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <article className="stat-card">
      <span className="admin-user-stat-icon">
        <Icon size={22} />
      </span>

      <div>
        <span>{label}</span>
        <strong>
          {value}
        </strong>
      </div>
    </article>
  );
}