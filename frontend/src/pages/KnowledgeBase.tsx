import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { KnowledgeArticle } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { formatDate, getApiErrorMessage } from '../utils/format';

const CATEGORIES = ['all', 'Troubleshooting', 'Account Setup', 'Billing', 'Integrations', 'Onboarding'];

export function KnowledgeBase() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    setLoading(true);
    api.articles.list({ search, category })
      .then(setArticles)
      .catch((e) => setError(getApiErrorMessage(e, 'knowledge base articles')))
      .finally(() => setLoading(false));
  }, [search, category]);

  return (
    <div>
      <div className="page-header">
        <h1>Knowledge Base</h1>
        <p>Internal documentation and guides for the support team</p>
      </div>

      <div className="filters-bar">
        <input className="input" placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 240 }} />
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
      </div>

      {loading ? <LoadingState message="Loading articles..." /> : error ? (
        <ErrorState title="Could not load knowledge base" message={error} hint="Ensure the backend is running on port 3001." />
      ) : articles.length === 0 ? (
        <EmptyState title="No articles found" description="Try adjusting your search or category filter." />
      ) : (
        <div className="kb-grid">
          {articles.map((a) => (
            <Link key={a.id} to={`/knowledge-base/${a.id}`} className="kb-card-link">
              <div className="card kb-card">
                <span className="badge badge-info">{a.category}</span>
                <h3 className="kb-card-title">{a.title}</h3>
                <p className="kb-card-summary">
                  {a.usage_note || a.content.slice(0, 120) + '...'}
                </p>
                <p className="kb-card-date">
                  {formatDate(a.created_at)}
                  {a.updated_at && a.updated_at !== a.created_at && ` · Updated ${formatDate(a.updated_at)}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
