export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLabel(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getApiErrorMessage(error: unknown, resource: string): string {
  const message = error instanceof Error ? error.message : 'Request failed';

  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return `Could not load ${resource}. Please check that the backend is running on port 3001.`;
  }
  if (message.includes('Database') || message.includes('503')) {
    return `Could not load ${resource}. Please check the database connection and restart the backend.`;
  }
  if (message === 'Internal server error') {
    return `Could not load ${resource}. Please check the backend connection and try again.`;
  }
  return `Could not load ${resource}. ${message}`;
}
