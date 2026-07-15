import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { DEMO_USER } from '../constants/demoUser';
import './Layout.css';

function KnowledgeBaseIcon() {
  return (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

const navItems: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/', label: 'Dashboard', icon: '◫' },
  { to: '/customers', label: 'Customers', icon: '◎' },
  { to: '/tickets', label: 'Tickets', icon: '✉' },
  { to: '/onboarding', label: 'Onboarding', icon: '☑' },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: <KnowledgeBaseIcon /> },
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
