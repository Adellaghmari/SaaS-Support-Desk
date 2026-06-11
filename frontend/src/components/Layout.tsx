import { NavLink, Outlet } from 'react-router-dom';
import { DEMO_USER } from '../constants/demoUser';
import './Layout.css';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◫' },
  { to: '/customers', label: 'Customers', icon: '◎' },
  { to: '/tickets', label: 'Tickets', icon: '✉' },
  { to: '/onboarding', label: 'Onboarding', icon: '☑' },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: '📖' },
  { to: '/settings', label: 'About Demo', icon: 'ℹ' },
];

export function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">SD</div>
          <div>
            <div className="brand-name">Support Desk</div>
            <div className="brand-sub">SaaS Platform</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{DEMO_USER.initials}</div>
            <div>
              <div className="user-name">{DEMO_USER.name}</div>
              <div className="user-role">{DEMO_USER.role}</div>
            </div>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
