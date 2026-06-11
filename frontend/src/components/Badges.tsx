import type { CustomerStatus, TicketStatus, TicketPriority, HealthLevel } from '../types';
import { formatLabel } from '../utils/format';

export function StatusBadge({ status }: { status: CustomerStatus | TicketStatus }) {
  const map: Record<string, string> = {
    active: 'badge-success',
    onboarding: 'badge-info',
    at_risk: 'badge-danger',
    inactive: 'badge-neutral',
    open: 'badge-info',
    in_progress: 'badge-warning',
    waiting_for_customer: 'badge-purple',
    resolved: 'badge-success',
  };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{formatLabel(status)}</span>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const map: Record<string, string> = {
    low: 'badge-neutral',
    medium: 'badge-info',
    high: 'badge-warning',
    urgent: 'badge-danger',
  };
  return <span className={`badge ${map[priority]}`}>{formatLabel(priority)}</span>;
}

export function CategoryBadge({ category }: { category: string }) {
  return <span className="badge badge-neutral">{formatLabel(category)}</span>;
}

export function HealthBadge({ score, level }: { score: number; level?: HealthLevel }) {
  const healthLevel = level || (score >= 70 ? 'healthy' : score >= 40 ? 'needs_attention' : 'at_risk');
  const classes: Record<HealthLevel, string> = {
    healthy: 'badge-success',
    needs_attention: 'badge-warning',
    at_risk: 'badge-danger',
  };
  return (
    <span className={`badge ${classes[healthLevel]}`}>
      <span className={`health-dot health-${healthLevel}`} />
      {score} · {formatLabel(healthLevel)}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    starter: 'badge-neutral',
    professional: 'badge-info',
    enterprise: 'badge-purple',
  };
  return <span className={`badge ${map[plan] || 'badge-neutral'}`}>{formatLabel(plan)}</span>;
}
