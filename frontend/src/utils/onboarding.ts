import type { OnboardingTask } from '../types';

export interface OnboardingProgressCustomer {
  total_tasks: number;
  completed_tasks: number;
  progress: number;
}

export function isIncompleteOnboarding(customer: OnboardingProgressCustomer): boolean {
  const total = Number(customer.total_tasks);
  const completed = Number(customer.completed_tasks);
  const progress = Number(customer.progress);
  if (total === 0) return progress !== 100;
  return completed < total;
}

export function isCompleteOnboarding(customer: OnboardingProgressCustomer): boolean {
  return !isIncompleteOnboarding(customer);
}

const NEXT_STEP_MAP: Record<string, string> = {
  'Account created': 'Schedule intro call with customer stakeholders',
  'Intro call completed': 'Complete technical setup and integrations',
  'Technical setup completed': 'Confirm first admin login',
  'First login completed': 'Invite customer team members',
  'Team invited': 'Schedule customer training session',
  'Customer trained': 'Prepare go live review',
  'Go live completed': 'Monitor account and hand off to support',
};

export function getOnboardingNextStep(tasks: OnboardingTask[]): string {
  const next = tasks.find((t) => !t.completed);
  if (!next) return 'All tasks complete. Schedule final go live review.';
  return NEXT_STEP_MAP[next.title] || `Complete: ${next.title}`;
}

export type OnboardingTrackStatus =
  | 'Behind schedule'
  | 'On track'
  | 'Ready for go live review';

export function getOnboardingTrackStatus(
  progress: number,
  overdueTasks: number
): OnboardingTrackStatus {
  if (progress >= 100) return 'Ready for go live review';
  if (overdueTasks > 0 || progress < 50) return 'Behind schedule';
  return 'On track';
}

export function getDaysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDaysUntilDue(days: number | null): string {
  if (days === null) return 'No due date set';
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  return `${days} day${days === 1 ? '' : 's'} until due`;
}
