import {
  Bell,
  BriefcaseBusiness,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserPlus2,
  UserRoundCog,
  Users,
  UsersRound
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import AppFooter from './AppFooter';
import {
  getNotifications,
  getSessionProfile,
  getUnreadNotificationsCount,
  logout,
  markAllNotificationsRead
} from '../services/api';
import { clearSession, getCurrentAdmin } from '../services/authSession';

function isRouteMatch(pathname, routes) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`) || pathname.includes('#'));
}

function getSidebarSections(role) {
  const helpItem = { to: '/help-center', label: 'Help Center', icon: HelpCircle, matchRoutes: ['/help-center'] };

  if (role === 'super_admin') {
    return [
      {
        title: 'Workspace',
        items: [
          { to: '/super-admin/workspace', label: 'Dashboard', icon: LayoutDashboard, matchRoutes: ['/super-admin/dashboard', '/super-admin/workspace'] },
          { to: '/super-admin/candidates', label: 'All Users', icon: UsersRound, matchRoutes: ['/super-admin/candidates'] },
          helpItem
        ]
      },
      {
        title: 'Platform',
        items: [
          { to: '/super-admin/admins', label: 'All Recruiters', icon: UsersRound },
          { to: '/super-admin/ads', label: 'Ads Management', icon: Megaphone },
          { to: '/super-admin/jobs', label: 'All Jobs', icon: BriefcaseBusiness },
          { to: '/super-admin/profiles', label: 'All Profiles', icon: Users }
        ]
      }
    ];
  }

  return [
    {
      title: 'Workspace',
      items: [
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/profiles', label: 'All Users', icon: UsersRound, matchRoutes: ['/admin/profiles'] },
        helpItem
      ]
    }
  ];
}

function getNotificationIcon(type) {
  if (type?.includes('JOB') || type?.includes('EXPORT')) {
    return BriefcaseBusiness;
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

function formatNotificationTime(value) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const notificationMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.innerWidth > 991;
  });
  const [isMobileSidebar, setIsMobileSidebar] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.innerWidth <= 991;
  });
  const [profile, setProfile] = useState(getCurrentAdmin());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setProfile(getCurrentAdmin());
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 991;
      setIsMobileSidebar(mobile);
      setSidebarOpen(!mobile);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const syncSession = () => setProfile(getCurrentAdmin());
    window.addEventListener('profiletrackhub-session-updated', syncSession);
    return () => window.removeEventListener('profiletrackhub-session-updated', syncSession);
  }, []);

  useEffect(() => {
    async function hydrateProfile() {
      try {
        const response = await getSessionProfile();
        setProfile(response.data.admin);
      } catch (_error) {
        clearSession();
        navigate('/login');
      }
    }

    hydrateProfile();
  }, [navigate]);

  useEffect(() => {
    async function loadNotificationsSummary() {
      if (!profile?.role) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        const [feedResponse, countResponse] = await Promise.all([
          getNotifications({ limit: 10 }),
          getUnreadNotificationsCount()
        ]);

        setNotifications(feedResponse.data?.data || []);
        setUnreadCount(countResponse.data?.unreadCount || 0);
      } catch (_error) {
        setNotifications([]);
        setUnreadCount(0);
      }
    }

    loadNotificationsSummary();
    const intervalId = window.setInterval(loadNotificationsSummary, 30000);

    return () => window.clearInterval(intervalId);
  }, [profile?.role, location.pathname]);

  useEffect(() => {
    setProfileMenuOpen(false);
    setNotificationsOpen(false);

    if (isMobileSidebar) {
      setSidebarOpen(false);
    }
  }, [isMobileSidebar, location.pathname]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const initials = useMemo(() => {
    const name = profile?.name?.trim() || 'Recruiter';
    return name.slice(0, 1).toUpperCase();
  }, [profile?.name]);

  const sidebarSections = getSidebarSections(profile?.role);
  const profileRoute = '/admin/profile';
  const settingsRoute = '/admin/settings';
  const homeRoute = profile?.role === 'super_admin' ? '/super-admin/workspace' : '/admin/dashboard';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_error) {
      // ignore cleanup transport issues
    } finally {
      clearSession();
      navigate('/login');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (_error) {
      // keep current UI state if request fails
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen((value) => !value);
  };

  return (
    <div className={`d-flex app-container app-shell ${profile?.role === 'super_admin' ? 'role-super-admin' : 'role-admin'}`}>
      {isMobileSidebar && sidebarOpen ? <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} type="button" /> : null}

      <aside className={`sidebar icon-sidebar flex-column ${sidebarOpen ? 'open' : 'collapsed'} ${isMobileSidebar ? (sidebarOpen ? 'mobile-open' : 'mobile-hidden') : ''}`}>
        <div className="sidebar-top">
          <div className="brand-wrap">
            <div className="brand-mark">
              <div className="brand-mark-dot" />
            </div>
            <div className={`brand ${sidebarOpen ? '' : 'd-none'}`}>ProfileTrackHub</div>
          </div>

          <button
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="sidebar-collapse-btn"
            onClick={toggleSidebar}
            type="button"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav px-2">
          {sidebarSections.map((section) => (
            <div className="sidebar-section" key={section.title}>
              <div className={`sidebar-section-title ${sidebarOpen ? '' : 'd-none'}`}>{section.title}</div>
              <ul className="list-unstyled mb-0 d-grid gap-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isRouteMatch(location.pathname, item.matchRoutes || [item.to]);

                  return (
                    <li key={item.to}>
                      <Link
                        className={`sidebar-link text-decoration-none ${isActive ? 'active' : ''}`}
                        title={item.label}
                        to={item.to}
                      >
                        <Icon size={20} />
                        <span className={sidebarOpen ? '' : 'd-none'}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={`sidebar-admin-card ${sidebarOpen ? '' : 'collapsed'}`}>
          {profile?.photo_url ? (
            <img alt={profile.name || 'Recruiter'} className="sidebar-admin-avatar-image" src={profile.photo_url} />
          ) : (
            <div className="sidebar-admin-avatar">{initials}</div>
          )}
          <div className={`sidebar-admin-copy ${sidebarOpen ? '' : 'd-none'}`}>
            <div className="sidebar-admin-name">{profile?.name || 'Recruiter'}</div>
            <div className="sidebar-admin-role">
              {profile?.role === 'super_admin' ? 'Super Admin' : 'Recruiter'}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-grow-1 app-main d-flex flex-column">
        <header className="header app-header">
          <div className="header-left-group">
            <button className="header-icon-btn" onClick={toggleSidebar} type="button">
              <Menu size={20} />
            </button>

            <button className="header-brand-center" onClick={() => navigate(homeRoute)} type="button">
              <div className="brand-mark small">
                <div className="brand-mark-dot" />
              </div>
              <span>
                <strong>ProfileTrackHub</strong>
                <small>{profile?.role === 'super_admin' ? 'Unified hiring command center' : 'Recruit Smarter. Hire Better.'}</small>
              </span>
            </button>
          </div>

          <div className="header-search-shell">
            <Search className="header-search-icon" size={16} />
            <input
              aria-label="Global search"
              className="header-search-input"
              placeholder="Search jobs, candidates, recruiters, or pages"
              type="text"
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
            />
          </div>

          <div className="header-right-group">
            <div className="notification-wrap" ref={notificationMenuRef}>
              <button
                className="header-icon-btn header-tool-btn"
                onClick={() => setNotificationsOpen((value) => !value)}
                type="button"
              >
                <Bell size={18} />
              </button>
              {unreadCount > 0 ? <span className="notification-badge">{unreadCount}</span> : null}

              {notificationsOpen ? (
                <div className="notifications-dropdown glass-card">
                  <div className="notifications-dropdown-head">
                    <div>
                      <strong>Notifications</strong>
                      <small>{unreadCount} unread</small>
                    </div>
                    <button className="ghost-btn" onClick={handleMarkAllRead} type="button">
                      <CheckCheck size={15} />
                      <span>Mark all as read</span>
                    </button>
                  </div>

                  <div className="notifications-dropdown-list">
                    {notifications.length ? (
                      notifications.map((item) => {
                        const Icon = getNotificationIcon(item.type);

                        return (
                          <button
                            className={`notification-dropdown-item ${item.is_read ? 'is-read' : 'is-unread'}`}
                            key={item.id}
                            onClick={() => {
                              setNotificationsOpen(false);
                              navigate('/notifications');
                            }}
                            type="button"
                          >
                            <div className="notification-dropdown-icon">
                              <Icon size={16} />
                            </div>
                            <div className="notification-dropdown-copy">
                              <div className="notification-dropdown-title-row">
                                <strong>{item.title}</strong>
                                <span className={`badge ${item.is_read ? 'badge-neutral' : 'badge-info'}`}>
                                  {item.is_read ? 'Read' : 'Unread'}
                                </span>
                              </div>
                              <p>{item.message}</p>
                              <small>{formatNotificationTime(item.created_at)}</small>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="notifications-empty-state">
                        <p>No notifications yet.</p>
                      </div>
                    )}
                  </div>

                  <div className="notifications-dropdown-foot">
                    <button className="ghost-btn" onClick={() => navigate('/notifications')} type="button">
                      <Bell size={15} />
                      <span>View all</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="header-profile-dropdown" ref={profileMenuRef}>
              <button className="header-admin profile-nav-btn" onClick={() => setProfileMenuOpen((value) => !value)} type="button">
                {profile?.photo_url ? (
                  <img alt={profile.name || 'Recruiter'} className="header-avatar-image" src={profile.photo_url} />
                ) : (
                  <div className="admin-avatar">{initials}</div>
                )}
                <div className="header-admin-copy">
                  <div className="header-admin-name">{profile?.name || 'Recruiter'}</div>
                  <div className="header-admin-role">
                    {profile?.role === 'super_admin' ? 'Super Admin' : 'Recruiter'}
                  </div>
                </div>
                <ChevronDown size={16} />
              </button>

              {profileMenuOpen ? (
                <div className="header-profile-menu">
                  <button className="header-profile-menu-item" onClick={() => navigate(profileRoute)} type="button">
                    <UserRoundCog size={16} />
                    <span>Profile</span>
                  </button>
                  <button className="header-profile-menu-item" onClick={() => navigate(settingsRoute)} type="button">
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  <button className="header-profile-menu-item danger" onClick={handleLogout} type="button">
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="content page-shell container-fluid flex-grow-1">{children}</div>
        <AppFooter />
      </main>
    </div>
  );
}
