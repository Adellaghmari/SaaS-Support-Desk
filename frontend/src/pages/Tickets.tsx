import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Ticket, TicketStatus, TicketPriority, TicketCategory, Customer } from '../types';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/Badges';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { Modal } from '../components/Modal';
import { formatDate, formatLabel, getApiErrorMessage } from '../utils/format';
import { validateTicketForm } from '../utils/validation';

export function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [form, setForm] = useState({
    customer_id: 0, title: '', description: '',
    status: 'open' as TicketStatus, priority: 'medium' as TicketPriority,
    category: 'general_question' as TicketCategory, assigned_to: 'Support Team',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    api.tickets.list({ search, status, priority, category, sort, order })
      .then(setTickets)
      .catch((e) => setError(getApiErrorMessage(e, 'tickets')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status, priority, category, sort, order]);
  useEffect(() => { api.customers.list().then(setCustomers).catch(() => {}); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      customer_id: customers[0]?.id || 0, title: '', description: '',
      status: 'open', priority: 'medium', category: 'general_question', assigned_to: 'Support Team',
    });
    setShowModal(true);
  };

  const openEdit = (t: Ticket) => {
    setEditing(t);
    setForm({
      customer_id: t.customer_id, title: t.title, description: t.description,
      status: t.status, priority: t.priority, category: t.category,
      assigned_to: t.assigned_to || 'Support Team',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateTicketForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      if (editing) {
        await api.tickets.update(editing.id, form);
      } else {
        await api.tickets.create(form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this ticket and all its comments?')) return;
    try {
      await api.tickets.delete(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1>Tickets</h1>
          <p>Support tickets, priorities, and customer communication</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Ticket</button>
      </div>

      <div className="filters-bar">
        <input className="input" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 220 }} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {(['open', 'in_progress', 'waiting_for_customer', 'resolved'] as const).map((v) => (
            <option key={v} value={v}>{formatLabel(v)}</option>
          ))}
        </select>
        <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="all">All Priorities</option>
          {(['low', 'medium', 'high', 'urgent'] as const).map((v) => (
            <option key={v} value={v}>{formatLabel(v)}</option>
          ))}
        </select>
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All Categories</option>
          {(['technical_issue', 'billing', 'onboarding', 'feature_request', 'account_access', 'general_question'] as const).map((v) => (
            <option key={v} value={v}>{formatLabel(v)}</option>
          ))}
        </select>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="created_at">Created Date</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
          <option value="updated_at">Updated Date</option>
        </select>
        <select className="select" value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {loading ? <LoadingState message="Loading tickets..." /> : error ? (
        <ErrorState title="Could not load tickets" message={error} hint="Ensure the backend is running on port 3001." />
      ) : tickets.length === 0 ? (
        <EmptyState title="No tickets found" description="Try adjusting your search or filters." />
      ) : (
        <div className="card table-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td className="ticket-title-cell"><Link to={`/tickets/${t.id}`} className="table-link"><strong>{t.title}</strong></Link></td>
                    <td>{t.company_name}</td>
                    <td><CategoryBadge category={t.category} /></td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>{t.assigned_to}</td>
                    <td>{formatDate(t.created_at)}</td>
                    <td>{formatDate(t.updated_at)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)} style={{ marginRight: '0.5rem' }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Ticket' : 'Create Ticket'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Customer</label>
              <select className={`select ${formErrors.customer_id ? 'input-error' : ''}`} value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: Number(e.target.value) })} disabled={!!editing}>
                {customers.length === 0 ? (
                  <option value={0}>No customers loaded. Check backend connection.</option>
                ) : (
                  customers.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)
                )}
              </select>
              {formErrors.customer_id && <span className="field-error">{formErrors.customer_id}</span>}
            </div>
            <div className="form-group">
              <label className="label">Title</label>
              <input className={`input ${formErrors.title ? 'input-error' : ''}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              {formErrors.title && <span className="field-error">{formErrors.title}</span>}
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className={`textarea ${formErrors.description ? 'input-error' : ''}`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              {formErrors.description && <span className="field-error">{formErrors.description}</span>}
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}>
                {(['low', 'medium', 'high', 'urgent'] as const).map((v) => (
                  <option key={v} value={v}>{formatLabel(v)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Category</label>
              <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TicketCategory })}>
                {(['technical_issue', 'billing', 'onboarding', 'feature_request', 'account_access', 'general_question'] as const).map((v) => (
                  <option key={v} value={v}>{formatLabel(v)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TicketStatus })}>
                {(['open', 'in_progress', 'waiting_for_customer', 'resolved'] as const).map((v) => (
                  <option key={v} value={v}>{formatLabel(v)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Assigned To</label>
              <input className="input" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create Ticket'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
