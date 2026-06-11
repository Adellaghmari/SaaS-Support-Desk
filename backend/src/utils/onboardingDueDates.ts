import { daysFromNow } from './seedDates';
import { isTaskCompleted } from './onboardingProgress';

export const ONBOARDING_TASK_DUE_OFFSETS: Record<string, number> = {
  'Account created': -42,
  'Intro call completed': -28,
  'Technical setup completed': -4,
  'First login completed': -2,
  'Team invited': -1,
  'Customer trained': 3,
  'Go live completed': 7,
};

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getOnboardingDueDateForTitle(title: string): string | null {
  const offset = ONBOARDING_TASK_DUE_OFFSETS[title];
  if (offset === undefined) return null;
  return daysFromNow(offset);
}

export function isOnboardingTaskOverdue(task: {
  title: string;
  completed: boolean | string | number | null | undefined;
}): boolean {
  if (isTaskCompleted(task.completed)) return false;
  const dueDate = getOnboardingDueDateForTitle(task.title);
  if (!dueDate) return false;
  return dueDate < todayIsoDate();
}

export function withDynamicOnboardingDueDates<
  T extends { title: string; due_date?: string | Date | null }
>(tasks: T[]): T[] {
  return tasks.map((task) => ({
    ...task,
    due_date: getOnboardingDueDateForTitle(task.title) ?? task.due_date ?? null,
  }));
}
