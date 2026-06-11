import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Customer, CustomerStatus } from '../types';
import { StatusBadge, HealthBadge, PlanBadge } from '../components/Badges';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { Modal } from '../components/Modal';
import { formatDate, formatLabel, getApiErrorMessage } from '../utils/format';
import { validateCustomerForm } from '../utils/validation';

const STATUSES: (CustomerStatus | 'all')[] = ['all', 'active', 'onboarding', 'at_risk', 'inactive'];

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '',
    plan: 'starter', status: 'active' as CustomerStatus,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    api.customers.list({ search, status, sort, order })
      .then(setCustomers)
      .catch((e) => setError(getApiErrorMessage(e, 'customers')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status, sort, order]);

  const openCreate = () => {
    setEditing(null);
    setForm({ company_name: '', contact_name: '', email: '', phone: '', plan: 'starter', status: 'active' });
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      company_name: c.company_name, contact_name: c.contact_name, email: c.email,
      phone: c.phone || '', plan: c.plan, status: c.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateCustomerForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      if (editing) {
        await api.customers.update(editing.id, form);
      } else {
        await api.customers.create(form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this customer and all related tickets, notes, and onboarding data?')) return;
    try {
      await api.customers.delete(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1>Customers</h1>
          <p>Accounts, health scores, and support history</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Customer</button>
      </div>

      <div className="filters-bar">
        <input className="input" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 220 }} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : formatLabel(s)}</option>)}
        </select>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="company_name">Company Name</option>
          <option value="health_score">Health Score</option>
          <option value="created_at">Created Date</option>
          <option value="status">Status</option>
        </select>
        <select className="select" value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {loading ? <LoadingState message="Loading customers..." /> : error ? (
        <ErrorState title="Could not load customers" message={error} hint="Ensure the backend is running on port 3001." />
      ) : customers.length === 0 ? (
        <EmptyState title="No customers found" description="Try adjusting your search or filters." />
      ) : (
        <div className="card table-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Health</th>
                  <th>Open Tickets</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="company-cell"><Link to={`/customers/${c.id}`} className="table-link"><strong>{c.company_name}</strong></Link></td>
                    <td>{c.contact_name}</td>
                    <td className="text-muted">{c.email}</td>
                    <td><PlanBadge plan={c.plan} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td><HealthBadge score={c.health_score} level={c.health_level} /></td>
                    <td>{c.open_tickets_count ?? 0}</td>
                    <td>{formatDate(c.created_at)}</td>
                    <td className="actions-cell">
                      <Link to={`/customers/${c.id}`} className="btn btn-primary btn-sm">View</Link>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Customer' : 'Add Customer'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Company Name</label>
              <input className={`input ${formErrors.company_name ? 'input-error' : ''}`} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
              {formErrors.company_name && <span className="field-error">{formErrors.company_name}</span>}
            </div>
            <div className="form-group">
              <label className="label">Contact Name</label>
              <input className={`input ${formErrors.contact_name ? 'input-error' : ''}`} value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
              {formErrors.contact_name && <span className="field-error">{formErrors.contact_name}</span>}
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input className={`input ${formErrors.email ? 'input-error' : ''}`} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {formErrors.email && <span className="field-error">{formErrors.email}</span>}
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Plan</label>
              <select className="select" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                {(['starter', 'professional', 'enterprise'] as const).map((v) => (
                  <option key={v} value={v}>{formatLabel(v)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CustomerStatus })}>
                {(['active', 'onboarding', 'at_risk', 'inactive'] as const).map((v) => (
                  <option key={v} value={v}>{formatLabel(v)}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create Customer'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
