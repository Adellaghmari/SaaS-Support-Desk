function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (import.meta.env.PROD) return 'https://saas-support-desk-api.onrender.com';
  return 'http://localhost:3001';
}

const API_BASE = getApiBase();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  dashboard: () => request<import('../types').DashboardData>('/api/dashboard'),

  customers: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<import('../types').Customer[]>(`/api/customers${qs}`);
    },
    get: (id: number) => request<import('../types').CustomerDetail>(`/api/customers/${id}`),
    create: (data: Partial<import('../types').Customer>) =>
      request<import('../types').Customer>('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<import('../types').Customer>) =>
      request<import('../types').Customer>(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ message: string }>(`/api/customers/${id}`, { method: 'DELETE' }),
    addNote: (id: number, note: string, created_by: string) =>
      request<import('../types').CustomerNote>(`/api/customers/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note, created_by }),
      }),
  },

  tickets: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<import('../types').Ticket[]>(`/api/tickets${qs}`);
    },
    get: (id: number) => request<import('../types').Ticket>(`/api/tickets/${id}`),
    create: (data: Partial<import('../types').Ticket>) =>
      request<import('../types').Ticket>('/api/tickets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<import('../types').Ticket>) =>
      request<import('../types').Ticket>(`/api/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ message: string }>(`/api/tickets/${id}`, { method: 'DELETE' }),
    comments: (id: number) =>
      request<import('../types').TicketComment[]>(`/api/tickets/${id}/comments`),
    addComment: (id: number, author: string, message: string, is_internal: boolean) =>
      request<import('../types').TicketComment>(`/api/tickets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ author, message, is_internal }),
      }),
  },

  onboarding: {
    list: (incomplete?: boolean) => {
      const qs = incomplete ? '?incomplete=true' : '';
      return request<{ customers: OnboardingCustomer[]; tasks: import('../types').OnboardingTask[] }>(
        `/api/onboarding${qs}`
      );
    },
    updateTask: (taskId: number, completed: boolean) =>
      request<import('../types').OnboardingTask>(`/api/onboarding/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ completed }),
      }),
  },

  articles: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<import('../types').KnowledgeArticle[]>(`/api/articles${qs}`);
    },
    get: (id: number) => request<import('../types').KnowledgeArticle>(`/api/articles/${id}`),
  },
};

interface OnboardingCustomer {
  id: number;
  company_name: string;
  contact_name: string;
  status: string;
  plan: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  progress: number;
}
