import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { KnowledgeArticle } from '../types';
import { LoadingState, ErrorState } from '../components/States';
import { formatDate, getApiErrorMessage } from '../utils/format';

export function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.articles.get(Number(id))
      .then(setArticle)
      .catch((e) => setError(getApiErrorMessage(e, 'article')))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState message="Loading article..." />;
  if (error) return <ErrorState title="Article not available" message={error} />;
  if (!article) return null;

  const showUpdated = article.updated_at && article.updated_at !== article.created_at;

  return (
    <div>
      <div className="page-header">
        <Link to="/knowledge-base" className="back-link">Back to Knowledge Base</Link>
        <h1>{article.title}</h1>
        <p>
          <span className="badge badge-info">{article.category}</span>
          <span className="meta-text">Published {formatDate(article.created_at)}</span>
          {showUpdated && (
            <span className="meta-text">Updated {formatDate(article.updated_at!)}</span>
          )}
        </p>
      </div>

      {article.usage_note && (
        <div className="usage-note-card card">
          <div className="card-title">When to use this guide</div>
          <p>{article.usage_note}</p>
        </div>
      )}

      <div className="support-note-card card">
        <div className="card-title">Support Note</div>
        <p>{article.support_note || 'No support note added yet.'}</p>
      </div>

      <div className="card">
        <div className="article-content">{article.content}</div>
      </div>
    </div>
  );
}
