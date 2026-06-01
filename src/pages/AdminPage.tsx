import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Page } from '../types';
import {
  AdminDashboardData,
  loadAdminDashboardData,
  setUserAdminStatus,
} from '../utils/adminDashboard';

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString();
};

type Props = {
  onNavigate: (page: Page) => void;
};

export default function AdminPage({ onNavigate }: Props) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadDashboard = async () => {
    setError('');
    setIsLoading(true);

    try {
      const data = await loadAdminDashboardData();
      setDashboard(data);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load admin dashboard.';
      setError(message);
      setDashboard(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const ok = localStorage.getItem('psaltikon_admin_authed') === 'true';
    setIsAuthorized(ok);

    const syncCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };

    void syncCurrentUser();

    if (!ok) {
      onNavigate('home');
      return;
    }

    void loadDashboard();
  }, [onNavigate]);

  const logout = () => {
    localStorage.removeItem('psaltikon_admin_authed');
    onNavigate('home');
  };

  const refresh = async () => {
    setIsRefreshing(true);
    await loadDashboard();
    setIsRefreshing(false);
  };

  const handleToggleAdmin = async (userId: string, nextAdminState: boolean) => {
    try {
      setUpdatingUserId(userId);
      await setUserAdminStatus(userId, nextAdminState);
      await refresh();

      if (currentUserId && currentUserId === userId && !nextAdminState) {
        localStorage.removeItem('psaltikon_admin_authed');
        onNavigate('home');
      }
    } catch (toggleError) {
      alert(toggleError instanceof Error ? toggleError.message : 'Failed to update admin access.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', marginBottom: 8 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: 700 }}>
            Overview of traffic, chant popularity, user suggestions, and account access.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('library')}>
            Back to Library
          </button>
          <button className="btn btn-secondary" onClick={refresh} disabled={isRefreshing || isLoading}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn btn-primary" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: '1rem 1.25rem',
            borderRadius: 16,
            border: '1px solid rgba(127, 29, 29, 0.18)',
            background: 'rgba(127, 29, 29, 0.08)',
            color: 'var(--burgundy)',
          }}
        >
          {error}
        </div>
      )}

      {isLoading || !dashboard ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--bg-surface)',
            borderRadius: 20,
            border: '1px solid var(--border-light)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.35 }}>⏳</div>
          <h3 style={{ marginBottom: 8 }}>Loading dashboard...</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Pulling live counts and admin data from Supabase.</p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            {dashboard.stats.map((stat) => (
              <motion.div
                key={stat.label}
                className="card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ padding: 18 }}
              >
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginTop: 8 }}>
                  {stat.value.toLocaleString()}
                </div>
                <div style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.92rem' }}>{stat.detail}</div>
              </motion.div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
            <section className="card" style={{ padding: 18 }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: 14 }}>Website Traffic</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {dashboard.pageTraffic.length > 0 ? (
                  dashboard.pageTraffic.map((entry) => (
                    <div key={entry.route} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{entry.route.replace('-', ' ')}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Last seen {formatDate(entry.last_viewed_at)}</div>
                      </div>
                      <div className="badge badge-burgundy" style={{ fontSize: '0.72rem' }}>
                        {entry.view_count.toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>No traffic has been tracked yet.</p>
                )}
              </div>
            </section>

            <section className="card" style={{ padding: 18 }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: 14 }}>Most Viewed Chants</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {dashboard.mostViewedChants.length > 0 ? (
                  dashboard.mostViewedChants.map((entry) => (
                    <div key={entry.chant_id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ fontWeight: 600 }}>{entry.chant?.title || 'Unknown chant'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {entry.view_count?.toLocaleString() || 0} views · {entry.chant?.service || 'Unknown service'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>No chant views have been tracked yet.</p>
                )}
              </div>
            </section>

            <section className="card" style={{ padding: 18 }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: 14 }}>Most Saved Chants</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {dashboard.mostSavedChants.length > 0 ? (
                  dashboard.mostSavedChants.map((entry) => (
                    <div key={entry.chant_id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ fontWeight: 600 }}>{entry.chant?.title || 'Unknown chant'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {entry.save_count?.toLocaleString() || 0} saves · {entry.chant?.part || 'Unknown part'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>No saved chants have been recorded yet.</p>
                )}
              </div>
            </section>
          </div>

          <section className="card" style={{ padding: 18, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', marginBottom: 6 }}>User Suggestions</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Requests and ideas submitted by signed-in users.</p>
              </div>
              <div className="badge badge-purple">{dashboard.suggestions.length.toLocaleString()} total</div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {dashboard.suggestions.length > 0 ? (
                dashboard.suggestions.map((suggestion) => (
                  <div key={suggestion.id} style={{ border: '1px solid var(--border-light)', borderRadius: 16, padding: 16, background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{suggestion.title}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          Submitted {formatDate(suggestion.created_at)} · {suggestion.status}
                        </div>
                      </div>
                      <div className="badge badge-gold">{suggestion.status}</div>
                    </div>
                    <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{suggestion.message}</p>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>No suggestions have been submitted yet.</div>
              )}
            </div>
          </section>

          <section className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', marginBottom: 6 }}>Users</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Grant or revoke admin access from profiles.</p>
              </div>
              <div className="badge badge-burgundy">{dashboard.users.filter((user) => user.admin).length.toLocaleString()} admins</div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>User</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Email / Username</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Joined</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Access</th>
                    <th style={{ padding: '0.75rem 0.5rem' }} />
                  </tr>
                </thead>
                <tbody>
                  {dashboard.users.map((user) => {
                    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
                    const isAdmin = !!user.admin;
                    const isCurrentUser = currentUserId === user.id;

                    return (
                      <tr key={user.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.9rem 0.5rem' }}>
                          <div style={{ fontWeight: 600 }}>{fullName || 'Unnamed user'}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user.id}</div>
                        </td>
                        <td style={{ padding: '0.9rem 0.5rem', color: 'var(--text-secondary)' }}>
                          {user.username || 'No username'}
                        </td>
                        <td style={{ padding: '0.9rem 0.5rem', color: 'var(--text-secondary)' }}>
                          {formatDate(user.created_at)}
                        </td>
                        <td style={{ padding: '0.9rem 0.5rem' }}>
                          <span className={`badge ${isAdmin ? 'badge-success' : 'badge-outline'}`}>
                            {isAdmin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td style={{ padding: '0.9rem 0.5rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={updatingUserId === user.id}
                            onClick={() => void handleToggleAdmin(user.id, !isAdmin)}
                          >
                            {updatingUserId === user.id
                              ? 'Saving...'
                              : isAdmin
                                ? isCurrentUser
                                  ? 'Revoke my admin'
                                  : 'Revoke admin'
                                : 'Grant admin'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
