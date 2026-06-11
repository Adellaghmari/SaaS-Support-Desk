export function isTaskCompleted(completed: unknown): boolean {
  return completed === true || completed === 1 || completed === '1' || completed === 't';
}

export function calcOnboardingProgress(tasks: { completed: unknown }[]) {
  const total_tasks = tasks.length;
  const completed_tasks = tasks.filter((t) => isTaskCompleted(t.completed)).length;
  const progress = total_tasks > 0 ? Math.round((completed_tasks / total_tasks) * 100) : 0;
  return { total_tasks, completed_tasks, progress };
}

export function isIncompleteOnboarding(customer: {
  total_tasks: number;
  completed_tasks: number;
  progress: number;
}): boolean {
  const total = Number(customer.total_tasks);
  const completed = Number(customer.completed_tasks);
  if (total === 0) return Number(customer.progress) !== 100;
  return completed < total;
}
