import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { DashboardData } from '../types';
import { StatusBadge, PriorityBadge, HealthBadge } from '../components/Badges';
import { LoadingState, ErrorState } from '../components/States';
import { formatDate, formatLabel, getApiErrorMessage } from '../utils/format';
import { normalizeSupportFocus } from '../utils/normalize';

const STAT_CARDS = [
  { key: 'total_customers', trendKey: 'total_customers', label: 'Total Customers', desc: 'Active accounts in the platform', icon: '◎' },
  { key: 'open_tickets', trendKey: 'open_tickets', label: 'Open Tickets', desc: 'Unresolved support issues', icon: '✉' },
  { key: 'high_priority_tickets', trendKey: 'high_priority_tickets', label: 'High Priority', desc: 'Urgent and high priority open', icon: '⚡' },
  { key: 'customers_at_risk', trendKey: 'customers_at_risk', label: 'Customers At Risk', desc: 'Accounts needing retention focus', icon: '⚠' },
  { key: 'onboarding_customers', trendKey: 'onboarding_customers', label: 'Onboarding In Progress', desc: 'Customers in setup phase', icon: '☑' },
  { key: 'resolved_tickets', trendKey: 'resolved_tickets', label: 'Resolved Tickets', desc: 'Successfully closed issues', icon: '✓' },
  { key: 'average_health_score', trendKey: 'average_health_score', label: 'Avg Health Score', desc: 'Average health across accounts', icon: '♥' },
] as const;

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .catch((e) => setError(getApiErrorMessage(e, 'dashboard data')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        message={error}
        hint="Start the backend with: cd backend && npm run dev"
      />
    );
  }
  if (!data) return null;

  const stats = data.stats ?? {
    total_customers: 0,
    open_tickets: 0,
    high_priority_tickets: 0,
    customers_at_risk: 0,
    onboarding_customers: 0,
    resolved_tickets: 0,
    average_health_score: 0,
  };
  const trends = data.trends ?? {};
  const status_breakdown = data.status_breakdown ?? { open: 0, in_progress: 0, waiting_for_customer: 0, resolved: 0 };
  const health_overview = data.health_overview ?? { healthy: 0, needs_attention: 0, at_risk: 0 };
  const recent_tickets = data.recent_tickets ?? [];
  const low_health_customers = data.low_health_customers ?? [];
  const at_risk_customers = data.at_risk_customers ?? [];
  const overdue_onboarding_tasks = data.overdue_onboarding_tasks ?? [];
  const supportFocusItems = normalizeSupportFocus(data.support_focus, {
    recent_tickets,
    at_risk_customers,
  });

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of customers, support workload, and customer health</p>
      </div>

      <div className="stat-grid">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className="stat-card stat-card-enhanced" data-metric={card.key}>
            <div className="stat-card-top">
              <span className="stat-icon-wrap">{card.icon}</span>
              <div className="value">{stats[card.key]}</div>
            </div>
            <div className="label">{card.label}</div>
            <div className="stat-desc">{card.desc}</div>
            {trends?.[card.trendKey] && (
              <div className="stat-trend">{trends[card.trendKey]}</div>
            )}
          </div>
        ))}
      </div>

      {supportFocusItems.length > 0 && (
        <div className="card support-focus-card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-title">Support Focus Today</div>
          <div className="focus-action-grid">
            {supportFocusItems.map((item, index) => (
              <div key={`${item.customer}-${index}`} className="focus-action-card">
                <div className="focus-action-row">
                  <span className="focus-action-label">Priority</span>
                  <span className={`badge badge-${item.priority === 'urgent' ? 'danger' : item.priority === 'high' ? 'warning' : item.priority === 'medium' ? 'info' : 'neutral'}`}>
                    {formatLabel(item.priority)}
                  </span>
                </div>
                <div className="focus-action-row">
                  <span className="focus-action-label">Customer</span>
                  <span className="focus-action-value">
                    {item.customer_id ? (
                      <Link to={`/customers/${item.customer_id}`} className="table-link">{item.customer}</Link>
                    ) : (
                      item.customer
                    )}
                  </span>
                </div>
                <div className="focus-action-row">
                  <span className="focus-action-label">Reason</span>
                  <span className="focus-action-value">{item.reason}</span>
                </div>
                <div className="focus-action-row">
                  <span className="focus-action-label">Action</span>
                  <span className="focus-action-value">{item.recommended_action}</span>
                </div>
                {(item.related_ticket || item.related_task) && (
                  <div className="focus-action-row">
                    <span className="focus-action-label">{item.related_ticket ? 'Related ticket' : 'Related task'}</span>
                    <span className="focus-action-value">
                      {item.related_ticket ? (
                        <Link to={`/tickets/${item.related_ticket.id}`} className="table-link">{item.related_ticket.title}</Link>
                      ) : (
                        item.related_task
                      )}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2 dashboard-overview-grid">
        <div className="card">
          <div className="card-title">Ticket Status Overview</div>
          <div className="status-list">
            {Object.entries(status_breakdown).map(([status, count]) => (
              <div key={status} className="status-row">
                <StatusBadge status={status as import('../types').TicketStatus} />
                <span className="status-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Customer Health Overview</div>
          <div className="status-list">
            <div className="status-row">
              <span className="badge badge-success"><span className="health-dot health-healthy" /> {formatLabel('healthy')}</span>
              <span className="status-count">{health_overview.healthy}</span>
            </div>
            <div className="status-row">
              <span className="badge badge-warning"><span className="health-dot health-needs_attention" /> {formatLabel('needs_attention')}</span>
              <span className="status-count">{health_overview.needs_attention}</span>
            </div>
            <div className="status-row">
              <span className="badge badge-danger"><span className="health-dot health-at_risk" /> {formatLabel('at_risk')}</span>
              <span className="status-count">{health_overview.at_risk}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.25rem' }}>
        <div className="card">
          <div className="card-title">Recent Tickets</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Customer</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent_tickets.map((t) => (
                  <tr key={t.id}>
                    <td><Link to={`/tickets/${t.id}`} className="table-link">{t.title}</Link></td>
                    <td>{t.company_name}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Customers At Risk</div>
          {at_risk_customers.length === 0 ? (
            <p className="muted-text">No customers currently at risk.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Health</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {at_risk_customers.map((c) => (
                    <tr key={c.id}>
                      <td><Link to={`/customers/${c.id}`} className="table-link">{c.company_name}</Link></td>
                      <td><HealthBadge score={c.health_score} level={c.health_level} /></td>
                      <td><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.25rem' }}>
        <div className="card">
          <div className="card-title">Low Health Score Customers</div>
          {low_health_customers.length === 0 ? (
            <p className="muted-text">All customers are in good health.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Health</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {low_health_customers.map((c) => (
                    <tr key={c.id}>
                      <td><Link to={`/customers/${c.id}`} className="table-link">{c.company_name}</Link></td>
                      <td><HealthBadge score={c.health_score} level={c.health_level} /></td>
                      <td><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Overdue Onboarding Tasks</div>
          {overdue_onboarding_tasks.length === 0 ? (
            <p className="muted-text">No overdue onboarding tasks.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Customer</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {overdue_onboarding_tasks.map((t) => (
                    <tr key={t.id}>
                      <td>{t.title}</td>
                      <td><Link to={`/customers/${t.customer_id}`} className="table-link">{t.company_name}</Link></td>
                      <td className="text-danger">{t.due_date ? formatDate(t.due_date) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
