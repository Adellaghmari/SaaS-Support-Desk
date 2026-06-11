import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Ticket, TicketComment } from '../types';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/Badges';
import { LoadingState, ErrorState } from '../components/States';
import { formatDateTime, formatLabel, getApiErrorMessage } from '../utils/format';
import { DEMO_USER } from '../constants/demoUser';

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerReply, setCustomerReply] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const load = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.tickets.get(Number(id)), api.tickets.comments(Number(id))])
      .then(([t, c]) => { setTicket(t); setComments(c); })
      .catch((e) => setError(getApiErrorMessage(e, 'ticket details')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const updateField = async (field: string, value: string) => {
    if (!ticket) return;
    try {
      const updated = await api.tickets.update(ticket.id, { [field]: value });
      setTicket(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const submitComment = async (message: string, isInternal: boolean) => {
    if (!message.trim() || !id) return;
    try {
      await api.tickets.addComment(Number(id), DEMO_USER.name, message, isInternal);
      if (isInternal) setInternalNote('');
      else setCustomerReply('');
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add comment');
    }
  };

  const handleCustomerReply = (e: React.FormEvent) => {
    e.preventDefault();
    submitComment(customerReply, false);
  };

  const handleInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    submitComment(internalNote, true);
  };

  const resolveTicket = () => updateField('status', 'resolved');

  if (loading) return <LoadingState message="Loading ticket..." />;
  if (error) return <ErrorState title="Ticket not available" message={error} />;
  if (!ticket) return null;

  const safeComments = comments ?? [];
  const customerComments = safeComments.filter((c) => !c.is_internal);
  const internalNotes = safeComments.filter((c) => c.is_internal);
  const activityHistory = [...safeComments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div>
      <div className="page-header">
        <Link to="/tickets" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'inline-block' }}>← Back to Tickets</Link>
        <h1>{ticket.title}</h1>
        <p>
          <Link to={`/customers/${ticket.customer_id}`}>{ticket.company_name}</Link>
          {' · '}{ticket.contact_name}
        </p>
      </div>

      <div className="card ticket-actions-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="card-title">Ticket Actions</div>
        <div className="ticket-actions-row">
          {ticket.status !== 'resolved' && (
            <button className="btn btn-primary btn-sm" onClick={resolveTicket}>Mark as Resolved</button>
          )}
          <div className="ticket-action-control">
            <label className="ticket-action-label">Change Status</label>
            <select className="select" value={ticket.status} onChange={(e) => updateField('status', e.target.value)}>
              {(['open', 'in_progress', 'waiting_for_customer', 'resolved'] as const).map((v) => (
                <option key={v} value={v}>{formatLabel(v)}</option>
              ))}
            </select>
          </div>
          <div className="ticket-action-control">
            <label className="ticket-action-label">Change Priority</label>
            <select className="select" value={ticket.priority} onChange={(e) => updateField('priority', e.target.value)}>
              {(['low', 'medium', 'high', 'urgent'] as const).map((v) => (
                <option key={v} value={v}>{formatLabel(v)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Ticket Details</div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.9375rem', lineHeight: 1.6 }}>{ticket.description}</p>
          <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div><strong>Status:</strong> <StatusBadge status={ticket.status} /></div>
            <div><strong>Priority:</strong> <PriorityBadge priority={ticket.priority} /></div>
            <div><strong>Category:</strong> <CategoryBadge category={ticket.category} /></div>
            <div><strong>Assigned to:</strong> {ticket.assigned_to}</div>
            <div><strong>Created:</strong> {formatDateTime(ticket.created_at)}</div>
            <div><strong>Updated:</strong> {formatDateTime(ticket.updated_at)}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Quick Status</div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <CategoryBadge category={ticket.category} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <div className="card-title">Customer Facing Comments ({customerComments.length})</div>
        <div style={{ marginTop: '0.75rem' }}>
          {customerComments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No customer facing comments yet.</p>
          ) : (
            customerComments.map((c) => (
              <div key={c.id} className="comment comment-customer">
                <div className="comment-header">
                  <span className="comment-author">{c.author}</span>
                  <span className="comment-time">{formatDateTime(c.created_at)}</span>
                </div>
                <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{c.message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <div className="card-title">Internal Notes ({internalNotes.length})</div>
        <div style={{ marginTop: '0.75rem' }}>
          {internalNotes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No internal notes yet.</p>
          ) : (
            internalNotes.map((c) => (
              <div key={c.id} className="comment comment-internal">
                <div className="comment-header">
                  <span className="comment-author">{c.author}</span>
                  <span className="comment-badge-internal">Internal</span>
                  <span className="comment-time">{formatDateTime(c.created_at)}</span>
                </div>
                <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{c.message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <div className="card-title">Activity History</div>
        <div style={{ marginTop: '0.75rem' }}>
          {activityHistory.length === 0 ? (
            <p className="muted-text">No activity recorded yet.</p>
          ) : (
            activityHistory.map((c) => (
              <div key={c.id} className={`comment ${c.is_internal ? 'comment-internal' : 'comment-customer'}`} style={{ marginBottom: '0.5rem' }}>
                <div className="comment-header">
                  <span className="comment-author">{c.author}</span>
                  {c.is_internal && <span className="comment-badge-internal">Internal</span>}
                  <span className="comment-time">{formatDateTime(c.created_at)}</span>
                </div>
                <p style={{ fontSize: '0.875rem' }}>{c.message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.25rem' }}>
        <div className="card">
          <div className="card-title">Add Customer Reply</div>
          <form onSubmit={handleCustomerReply} style={{ marginTop: '0.75rem' }}>
            <textarea
              className="textarea"
              placeholder="Add a customer facing comment..."
              value={customerReply}
              onChange={(e) => setCustomerReply(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} disabled={!customerReply.trim()}>
              Add Customer Reply
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Add Internal Note</div>
          <form onSubmit={handleInternalNote} style={{ marginTop: '0.75rem' }}>
            <textarea
              className="textarea"
              placeholder="Add an internal note (not visible to customer)..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }} disabled={!internalNote.trim()}>
              Add Internal Note
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
