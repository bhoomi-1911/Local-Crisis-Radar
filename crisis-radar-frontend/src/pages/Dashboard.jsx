import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/client';
import Badge from '../components/Badge';
import {
  sevBadgeClass,
  statusBadgeClass,
} from '../components/ReportRow';
import { useAuth } from '../context/AuthContext';
import {
  TYPE_LABEL,
  SEV_ORDER,
  STATUS_LABEL,
  timeAgo,
} from '../constants';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="centered-msg">
        <p>Log in to see your dashboard.</p>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/login')}
        >
          Log in
        </button>
      </div>
    );
  }

  return (
    <div className="wrap dashwrap">
      {user.role === 'citizen' && <CitizenDashboard />}
      {user.role === 'authority' && <AuthorityDashboard />}
      {user.role === 'admin' && (
        <AdminDashboard currentUser={user} />
      )}
    </div>
  );
}

/* =========================================================
   CITIZEN DASHBOARD
   ========================================================= */

function CitizenDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reports/mine')
      .then((r) => setReports(r.data.reports))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 26, marginBottom: 4 }}>
        My reports
      </h2>

      <p
        style={{
          color: 'var(--muted)',
          fontSize: 14,
          marginBottom: 20,
        }}
      >
        Reports you've submitted.
      </p>

      <div className="card">
        {loading ? (
          <div style={{ padding: 20, color: 'var(--muted)' }}>
            Loading…
          </div>
        ) : reports.length === 0 ? (
          <div style={{ padding: 20, color: 'var(--muted)' }}>
            You haven't submitted a report yet.
          </div>
        ) : (
          <table className="dtable">
            <thead>
              <tr>
                <th>Report</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reported</th>
              </tr>
            </thead>

            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>

                  <td>{TYPE_LABEL[r.type]}</td>

                  <td>
                    <Badge
                      text={
                        r.severity[0].toUpperCase() +
                        r.severity.slice(1)
                      }
                      className={sevBadgeClass(r.severity)}
                    />
                  </td>

                  <td>
                    <Badge
                      text={STATUS_LABEL[r.status]}
                      className={statusBadgeClass(r.status)}
                    />
                  </td>

                  <td className="mono">
                    {timeAgo(r.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   AUTHORITY DASHBOARD
   ========================================================= */

function AuthorityDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    api
      .get('/reports')
      .then((r) => {
        const queue = r.data.reports
          .filter((i) => i.status !== 'resolved')
          .sort(
            (a, b) =>
              SEV_ORDER.indexOf(a.severity) -
              SEV_ORDER.indexOf(b.severity)
          );

        setReports(queue);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    setBusyId(id);

    try {
      await api.patch(`/reports/${id}/status`, {
        status,
      });

      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 26, marginBottom: 4 }}>
        Authority queue
      </h2>

      <p
        style={{
          color: 'var(--muted)',
          fontSize: 14,
          marginBottom: 20,
        }}
      >
        Sorted by severity. Verify, escalate or resolve incoming
        reports.
      </p>

      <div className="card">
        {loading ? (
          <div style={{ padding: 20, color: 'var(--muted)' }}>
            Loading…
          </div>
        ) : (
          <table className="dtable">
            <thead>
              <tr>
                <th>Report</th>
                <th>Area</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reported</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>

                  <td>{r.area || '—'}</td>

                  <td>
                    <Badge
                      text={
                        r.severity[0].toUpperCase() +
                        r.severity.slice(1)
                      }
                      className={sevBadgeClass(r.severity)}
                    />
                  </td>

                  <td>
                    <Badge
                      text={STATUS_LABEL[r.status]}
                      className={statusBadgeClass(r.status)}
                    />
                  </td>

                  <td className="mono">
                    {timeAgo(r.created_at)}
                  </td>

                  <td>
                    {r.status === 'reported' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={busyId === r.id}
                        onClick={() =>
                          setStatus(r.id, 'verified')
                        }
                      >
                        Verify
                      </button>
                    )}

                    {r.status === 'verified' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={busyId === r.id}
                        onClick={() =>
                          setStatus(r.id, 'progress')
                        }
                      >
                        Mark in progress
                      </button>
                    )}

                    {r.status === 'progress' && (
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={busyId === r.id}
                        onClick={() =>
                          setStatus(r.id, 'resolved')
                        }
                      >
                        Mark resolved
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {reports.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      color: 'var(--muted)',
                      padding: 20,
                    }}
                  >
                    Queue is empty — nothing open right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

function AdminDashboard({ currentUser }) {
  const [tab, setTab] = useState('reports');

  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState(null);
  const [error, setError] = useState(null);

  // Add-user form
  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('authority');
  const [creatingUser, setCreatingUser] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [r, u] = await Promise.all([
        api.get('/reports'),
        api.get('/users'),
      ]);

      setReports(r.data.reports);
      setUsers(u.data.users);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Could not load admin dashboard.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const createUser = async (e) => {
    e.preventDefault();

    setCreatingUser(true);
    setError(null);

    try {
      await api.post('/users', {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });

      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('authority');

      setShowAddUser(false);

      await loadAll();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Could not create user.'
      );
    } finally {
      setCreatingUser(false);
    }
  };

  const removeReport = async (id) => {
    try {
      setError(null);

      await api.delete(`/reports/${id}`);

      setReports((prev) =>
        prev.filter((r) => r.id !== id)
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Could not remove report.'
      );
    }
  };

  const suspendUser = async (id, isActive) => {
    setBusyUserId(id);
    setError(null);

    try {
      await api.patch(`/users/${id}/suspend`, {
        is_active: !isActive,
      });

      await loadAll();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Could not update user status.'
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const changeUserRole = async (id, role) => {
    setBusyUserId(id);
    setError(null);

    try {
      await api.patch(`/users/${id}/role`, {
        role,
      });

      await loadAll();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Could not change user role.'
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const total = reports.length;

  const active = reports.filter(
    (r) => r.status !== 'resolved'
  ).length;

  const authorityCount = users.filter(
    (u) => u.role === 'authority'
  ).length;

  return (
    <div>
      <h2 style={{ fontSize: 26, marginBottom: 20 }}>
        Admin overview
      </h2>

      {error && (
        <div
          className="error-banner"
          style={{ marginBottom: 20 }}
        >
          {error}
        </div>
      )}

      <div className="kpis">
        <div className="kpi">
          <div className="num">{total}</div>
          <div className="lbl">Total reports</div>
        </div>

        <div className="kpi">
          <div className="num">{active}</div>
          <div className="lbl">Active incidents</div>
        </div>

        <div className="kpi">
          <div className="num">{users.length}</div>
          <div className="lbl">Registered users</div>
        </div>

        <div className="kpi">
          <div className="num">{authorityCount}</div>
          <div className="lbl">Authority accounts</div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tabbtn ${
            tab === 'reports' ? 'active' : ''
          }`}
          onClick={() => setTab('reports')}
        >
          Manage reports
        </button>

        <button
          className={`tabbtn ${
            tab === 'users' ? 'active' : ''
          }`}
          onClick={() => setTab('users')}
        >
          Manage users
        </button>

        <button
          className={`tabbtn ${
            tab === 'categories' ? 'active' : ''
          }`}
          onClick={() => setTab('categories')}
        >
          Categories
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 20, color: 'var(--muted)' }}>
          Loading…
        </div>
      ) : tab === 'reports' ? (
        <div className="card">
          <table className="dtable">
            <thead>
              <tr>
                <th>Report</th>
                <th>Type</th>
                <th>Status</th>
                <th>Reported</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {reports.slice(0, 20).map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>

                  <td>{TYPE_LABEL[r.type]}</td>

                  <td>
                    <Badge
                      text={STATUS_LABEL[r.status]}
                      className={statusBadgeClass(r.status)}
                    />
                  </td>

                  <td className="mono">
                    {timeAgo(r.created_at)}
                  </td>

                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeReport(r.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {reports.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      color: 'var(--muted)',
                      padding: 20,
                    }}
                  >
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : tab === 'users' ? (
        <div>
          {/* Add User button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 14,
            }}
          >
            <button
              className="btn btn-primary"
              onClick={() =>
                setShowAddUser((previous) => !previous)
              }
            >
              {showAddUser ? 'Cancel' : '+ Add user'}
            </button>
          </div>

          {/* Add User form */}
          {showAddUser && (
            <div
              className="card"
              style={{
                padding: 20,
                marginBottom: 20,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Create user account
              </h3>

              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                Create a new citizen, authority or administrator
                account.
              </p>

              <form onSubmit={createUser}>
                <div className="field">
                  <label htmlFor="admin-new-name">
                    Name
                  </label>

                  <input
                    id="admin-new-name"
                    type="text"
                    value={newName}
                    onChange={(e) =>
                      setNewName(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="admin-new-email">
                    Email
                  </label>

                  <input
                    id="admin-new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) =>
                      setNewEmail(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="admin-new-password">
                    Temporary password
                  </label>

                  <input
                    id="admin-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    minLength={8}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="admin-new-role">
                    Role
                  </label>

                  <select
                    id="admin-new-role"
                    value={newRole}
                    onChange={(e) =>
                      setNewRole(e.target.value)
                    }
                  >
                    <option value="citizen">
                      Citizen
                    </option>

                    <option value="authority">
                      Authority
                    </option>

                    <option value="admin">
                      Admin
                    </option>
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={creatingUser}
                >
                  {creatingUser
                    ? 'Creating…'
                    : 'Create account'}
                </button>
              </form>
            </div>
          )}

          {/* Existing users */}
          <div className="card">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Reports filed</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => {
                  const isCurrentUser =
                    Number(u.id) ===
                    Number(currentUser.id);

                  return (
                    <tr key={u.id}>
                      <td>
                        {u.name}

                        {isCurrentUser && (
                          <span
                            style={{
                              color: 'var(--muted)',
                              fontSize: 12,
                              marginLeft: 6,
                            }}
                          >
                            (You)
                          </span>
                        )}
                      </td>

                      <td>{u.email}</td>

                      <td>
                        {isCurrentUser ? (
                          <span
                            style={{
                              textTransform:
                                'capitalize',
                              fontWeight: 600,
                            }}
                          >
                            {u.role}
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            disabled={
                              busyUserId === u.id
                            }
                            onChange={(e) =>
                              changeUserRole(
                                u.id,
                                e.target.value
                              )
                            }
                            style={{
                              padding: '7px 10px',
                              border:
                                '1px solid var(--line)',
                              borderRadius: 6,
                              background: '#fff',
                              fontFamily: 'inherit',
                            }}
                          >
                            <option value="citizen">
                              Citizen
                            </option>

                            <option value="authority">
                              Authority
                            </option>

                            <option value="admin">
                              Admin
                            </option>
                          </select>
                        )}
                      </td>

                      <td>{u.reports_filed}</td>

                      <td>
                        {u.is_active
                          ? 'Active'
                          : 'Suspended'}
                      </td>

                      <td>
                        {isCurrentUser ? (
                          <span
                            style={{
                              color: 'var(--muted)',
                              fontSize: 12.5,
                            }}
                          >
                            Current account
                          </span>
                        ) : (
                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={
                              busyUserId === u.id
                            }
                            onClick={() =>
                              suspendUser(
                                u.id,
                                u.is_active
                              )
                            }
                          >
                            {u.is_active
                              ? 'Suspend'
                              : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <table className="dtable">
            <thead>
              <tr>
                <th>Category</th>
                <th>Open reports</th>
              </tr>
            </thead>

            <tbody>
              {Object.entries(TYPE_LABEL).map(
                ([k, label]) => (
                  <tr key={k}>
                    <td>{label}</td>

                    <td>
                      {
                        reports.filter(
                          (r) =>
                            r.type === k &&
                            r.status !== 'resolved'
                        ).length
                      }
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}