import { Bell, BriefcaseBusiness, CheckCheck, CircleAlert, LifeBuoy, Search, ShieldCheck, Trash2, UserPlus2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  clearReadNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../../services/api';
import { getCurrentAdmin } from '../../services/authSession';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
  { key: 'applications', label: 'Applications' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'help_requests', label: 'Help Requests' },
  { key: 'system', label: 'System' }
];

function getNotificationIcon(type) {
  if (type?.includes('JOB') || type?.includes('EXPORT')) {
    return BriefcaseBusiness;
  }

  if (type?.includes('APPLICATION') || type?.includes('RESUME') || type?.includes('STATUS')) {
    return Bell;
  }

  if (type?.includes('PASSWORD') || type?.includes('HELP')) {
    return LifeBuoy;
  }

  if (type?.includes('ADMIN')) {
    return UserPlus2;
  }

  if (type === 'SYSTEM') {
    return ShieldCheck;
  }

  return CircleAlert;
}

function getFilterParams(activeFilter, search) {
  const params = { limit: 200 };

  if (activeFilter === 'unread' || activeFilter === 'read') {
    params.status = activeFilter;
  } else if (activeFilter !== 'all') {
    params.category = activeFilter;
  }

  if (search.trim()) {
    params.search = search.trim();
  }

  return params;
}

function formatNotificationTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export default function NotificationsPage() {
  const admin = getCurrentAdmin();
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const headerTitle = useMemo(
    () => (admin?.role === 'super_admin' ? 'All Notifications' : 'My Notifications'),
    [admin?.role]
  );

  const loadNotifications = async () => {
    setLoading(true);

    try {
      const response = await getNotifications(getFilterParams(activeFilter, search));
      setNotifications(response.data?.data || []);
    } catch (_error) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [activeFilter]);

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    await loadNotifications();
  };

  const handleMarkSingleRead = async (id) => {
    setBusyId(id);
    try {
      await markNotificationRead(id);
      setNotifications((items) => items.map((item) => (
        item.id === id ? { ...item, is_read: true } : item
      )));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await deleteNotification(id);
      setNotifications((items) => items.filter((item) => item.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setBusyId('all');
    try {
      await markAllNotificationsRead();
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    } finally {
      setBusyId(null);
    }
  };

  const handleClearRead = async () => {
    setBusyId('clear');
    try {
      await clearReadNotifications();
      setNotifications((items) => items.filter((item) => !item.is_read));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="notifications-page-shell d-grid gap-4">
      <div className="glass-card page-hero-card notifications-hero-card">
        <div className="notifications-hero-head">
          <div>
            <p className="eyebrow mb-2">Notifications Center</p>
            <h1 className="page-title mb-2">{headerTitle}</h1>
            <p className="section-copy mb-0">
              Track hiring activity, exports, requests, and system updates in one place.
            </p>
          </div>

          <div className="notifications-hero-actions">
            <button className="ghost-btn" disabled={busyId === 'all'} onClick={handleMarkAllRead} type="button">
              <CheckCheck size={16} />
              <span>Mark all as read</span>
            </button>
            <button className="ghost-btn" disabled={busyId === 'clear'} onClick={handleClearRead} type="button">
              <Trash2 size={16} />
              <span>Clear read</span>
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card notifications-toolbar-card">
        <div className="notifications-toolbar">
          <div className="notifications-filters">
            {FILTERS.map((filter) => (
              <button
                className={`filter-chip ${activeFilter === filter.key ? 'active' : ''}`}
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>

          <form className="notification-search" onSubmit={handleSearchSubmit}>
            <Search size={16} />
            <input
              placeholder="Search notifications"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </form>
        </div>
      </div>

      <div className="notifications-page-list">
        {loading ? (
          <div className="glass-card empty-state-card">
            <p className="section-copy mb-0">Loading notifications...</p>
          </div>
        ) : notifications.length ? (
          notifications.map((item) => {
            const Icon = getNotificationIcon(item.type);

            return (
              <article
                className={`notification-card ${item.is_read ? 'is-read' : 'is-unread'}`}
                key={item.id}
              >
                <div className="notification-card-icon">
                  <Icon size={18} />
                </div>

                <div className="notification-card-body">
                  <div className="notification-card-head">
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.message}</p>
                    </div>
                    <div className="notification-meta">
                      <span className={`badge ${item.is_read ? 'badge-neutral' : 'badge-info'}`}>
                        {item.is_read ? 'Read' : 'Unread'}
                      </span>
                      <time>{formatNotificationTime(item.created_at)}</time>
                    </div>
                  </div>

                  <div className="notification-card-actions">
                    {!item.is_read ? (
                      <button
                        className="ghost-btn"
                        disabled={busyId === item.id}
                        onClick={() => handleMarkSingleRead(item.id)}
                        type="button"
                      >
                        <CheckCheck size={15} />
                        <span>Mark read</span>
                      </button>
                    ) : null}
                    <button
                      className="ghost-btn danger"
                      disabled={busyId === item.id}
                      onClick={() => handleDelete(item.id)}
                      type="button"
                    >
                      <Trash2 size={15} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="glass-card empty-state-card">
            <p className="section-copy mb-0">No notifications found for the selected filter.</p>
          </div>
        )}
      </div>
    </section>
  );
}
