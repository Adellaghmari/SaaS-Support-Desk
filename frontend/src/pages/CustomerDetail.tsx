import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { CustomerDetail as CustomerDetailType } from '../types';
import { StatusBadge, HealthBadge, PlanBadge, PriorityBadge } from '../components/Badges';
import { LoadingState, ErrorState } from '../components/States';
import { formatDate, formatDateTime, getApiErrorMessage } from '../utils/format';
import { buildCustomerSuccessSummary } from '../utils/normalize';
import { DEMO_USER } from '../constants/demoUser';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const load = () => {
    if (!id) return;
    setLoading(true);
    api.customers.get(Number(id))
      .then(setCustomer)
      .catch((e) => setError(getApiErrorMessage(e, 'customer details')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || !id) return;
    try {
      await api.customers.addNote(Number(id), note, DEMO_USER.name);
      setNote('');
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add note');
    }
  };

  if (loading) return <LoadingState message="Loading customer..." />;
  if (error) return <ErrorState title="Customer not available" message={error} />;
  if (!customer) return null;

  const tickets = customer.tickets ?? [];
  const notes = customer.notes ?? [];
  const onboardingTasks = customer.onboarding_tasks ?? [];
  const successSummary = buildCustomerSuccessSummary(customer);

  const activeTickets = tickets.filter((t) => t.status !== 'resolved');
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved');
  const completedTasks = onboardingTasks.filter((t) => t.completed).length;
  const progress = onboardingTasks.length > 0
    ? Math.round((completedTasks / onboardingTasks.length) * 100)
    : 100;

  return (
    <div>
      <div className="page-header">
        <Link to="/customers" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'inline-block' }}>← Back to Customers</Link>
        <h1>{customer.company_name}</h1>
        <p>Account overview and support history</p>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-title">Customer Success Summary</div>
        <div className="cs-summary-grid">
          <div className="cs-summary-item">
            <span className="cs-summary-label">Health reason</span>
            <p>{successSummary.health_reason}</p>
          </div>
          <div className="cs-summary-item">
            <span className="cs-summary-label">Main risk</span>
            <p>{successSummary.main_risk}</p>
          </div>
          <div className="cs-summary-item">
            <span className="cs-summary-label">Next step</span>
            <p>{successSummary.next_step}</p>
          </div>
          <div className="cs-summary-item">
            <span className="cs-summary-label">Owner</span>
            <p>{successSummary.owner}</p>
          </div>
        </div>
      </div>

      <div className="action-card" style={{ marginBottom: '1.5rem' }}>
        <h3>Recommended Next Action</h3>
        <p>{customer.recommended_action || 'No next action available'}</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="value" style={{ fontSize: '1.25rem' }}><HealthBadge score={customer.health_score} level={customer.health_level} /></div>
          <div className="label">Health Score</div>
        </div>
        <div className="stat-card">
          <div className="value">{activeTickets.length}</div>
          <div className="label">Active Tickets</div>
        </div>
        <div className="stat-card">
          <div className="value">{resolvedTickets.length}</div>
          <div className="label">Resolved Tickets</div>
        </div>
        <div className="stat-card">
          <div className="value">{progress}%</div>
          <div className="label">Onboarding Progress</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Customer Profile</div>
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div><strong>Contact:</strong> {customer.contact_name}</div>
            <div><strong>Email:</strong> {customer.email}</div>
            <div><strong>Phone:</strong> {customer.phone || 'N/A'}</div>
            <div><strong>Plan:</strong> <PlanBadge plan={customer.plan} /></div>
            <div><strong>Status:</strong> <StatusBadge status={customer.status} /></div>
            <div><strong>Customer since:</strong> {formatDate(customer.created_at)}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Onboarding Progress</div>
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span>{completedTasks} of {onboardingTasks.length} tasks completed</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            {onboardingTasks.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {onboardingTasks.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <span>{t.completed ? '✓' : '○'}</span>
                    <span style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--text-muted)' : 'inherit' }}>
                      {t.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.25rem' }}>
        <div className="card">
          <div className="card-title">Active Tickets</div>
          {activeTickets.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>No active tickets.</p>
          ) : (
            <div className="table-container" style={{ marginTop: '0.5rem' }}>
              <table>
                <thead><tr><th>Title</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>
                  {activeTickets.map((t) => (
                    <tr key={t.id}>
                      <td><Link to={`/tickets/${t.id}`}>{t.title}</Link></td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Resolved Tickets</div>
          {resolvedTickets.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>No resolved tickets yet.</p>
          ) : (
            <div className="table-container" style={{ marginTop: '0.5rem' }}>
              <table>
                <thead><tr><th>Title</th><th>Priority</th><th>Resolved</th></tr></thead>
                <tbody>
                  {resolvedTickets.map((t) => (
                    <tr key={t.id}>
                      <td><Link to={`/tickets/${t.id}`}>{t.title}</Link></td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td>{formatDateTime(t.updated_at)}</td>
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
          <div className="card-title">Support History</div>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tickets.slice(0, 6).map((t) => (
              <div key={t.id} style={{ fontSize: '0.875rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <Link to={`/tickets/${t.id}`}>{t.title}</Link>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  {formatDateTime(t.created_at)} · <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Customer Notes</div>
        <form onSubmit={handleAddNote} style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
          <textarea className="textarea" placeholder="Add an internal note about this customer..." value={note} onChange={(e) => setNote(e.target.value)} />
          <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }} disabled={!note.trim()}>Add Note</button>
        </form>
        {notes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No notes yet.</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.875rem' }}>{n.note}</p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {n.created_by} · {formatDateTime(n.created_at)}
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}
