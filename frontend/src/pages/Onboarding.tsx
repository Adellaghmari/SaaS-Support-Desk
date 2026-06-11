import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { OnboardingTask } from '../types';
import { StatusBadge, PlanBadge } from '../components/Badges';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { formatDate, getApiErrorMessage } from '../utils/format';
import {
  getOnboardingNextStep,
  getOnboardingTrackStatus,
  getDaysUntilDue,
  formatDaysUntilDue,
  isIncompleteOnboarding,
  isCompleteOnboarding,
} from '../utils/onboarding';
import { DEMO_USER } from '../constants/demoUser';

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

function isTaskOverdue(task: OnboardingTask): boolean {
  if (task.completed || !task.due_date) return false;
  const due = new Date(task.due_date);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function recalcCustomer(
  customer: OnboardingCustomer,
  customerTasks: OnboardingTask[]
): OnboardingCustomer {
  const total = customerTasks.length;
  const completed = customerTasks.filter((t) => t.completed).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 100;
  const overdue = customerTasks.filter((t) => isTaskOverdue(t)).length;
  return {
    ...customer,
    total_tasks: total,
    completed_tasks: completed,
    progress,
    overdue_tasks: overdue,
  };
}

export function Onboarding() {
  const [allCustomers, setAllCustomers] = useState<OnboardingCustomer[]>([]);
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<number>>(() => new Set());

  const scrollYRef = useRef(0);
  const restoreScrollRef = useRef(false);

  const scheduleScrollRestore = () => {
    scrollYRef.current = window.scrollY;
    restoreScrollRef.current = true;
  };

  useLayoutEffect(() => {
    if (restoreScrollRef.current) {
      window.scrollTo(0, scrollYRef.current);
      restoreScrollRef.current = false;
    }
  });

  const applyData = (data: { customers?: OnboardingCustomer[]; tasks?: OnboardingTask[] }) => {
    setAllCustomers(data.customers ?? []);
    setTasks(data.tasks ?? []);
  };

  const loadInitial = () => {
    setLoading(true);
    setError('');
    api.onboarding.list(false)
      .then(applyData)
      .catch((e) => setError(getApiErrorMessage(e, 'onboarding data')))
      .finally(() => setLoading(false));
  };

  const silentRefresh = async () => {
    const data = await api.onboarding.list(false);
    applyData(data);
  };

  useEffect(() => { loadInitial(); }, []);

  useEffect(() => {
    if (!actionError) return;
    const timer = window.setTimeout(() => setActionError(''), 4000);
    return () => window.clearTimeout(timer);
  }, [actionError]);

  const toggleTask = async (taskId: number, completed: boolean) => {
    if (pendingTaskIds.has(taskId)) return;

    scheduleScrollRestore();
    setActionError('');

    const previousTasks = tasks;
    const previousCustomers = allCustomers;
    const newCompleted = !completed;

    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: newCompleted } : t
    );
    setTasks(updatedTasks);

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setAllCustomers((prev) =>
        prev.map((c) => {
          if (c.id !== task.customer_id) return c;
          const customerTasks = updatedTasks.filter((t) => t.customer_id === c.id);
          return recalcCustomer(c, customerTasks);
        })
      );
    }

    setPendingTaskIds((prev) => new Set(prev).add(taskId));

    try {
      await api.onboarding.updateTask(taskId, newCompleted);
      await silentRefresh();
      scheduleScrollRestore();
    } catch (err) {
      setTasks(previousTasks);
      setAllCustomers(previousCustomers);
      setActionError(err instanceof Error ? err.message : 'Failed to update task');
      scheduleScrollRestore();
    } finally {
      setPendingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleIncompleteToggle = (checked: boolean) => {
    scheduleScrollRestore();
    setIncompleteOnly(checked);
  };

  const totalCount = allCustomers.length;

  const displayedCustomers = incompleteOnly
    ? allCustomers.filter(isIncompleteOnboarding)
    : allCustomers;

  const customerById = new Map(allCustomers.map((c) => [c.id, c]));

  const overdueTasks = tasks.filter((t) => {
    if (!isTaskOverdue(t)) return false;
    const customer = customerById.get(t.customer_id);
    if (!customer) return false;
    if (incompleteOnly) return isIncompleteOnboarding(customer);
    return true;
  });

  const showOverdueSection = overdueTasks.length > 0 || incompleteOnly;

  const counterText = incompleteOnly
    ? `Showing ${displayedCustomers.length} of ${totalCount} incomplete onboarding customers`
    : `Showing ${totalCount} of ${totalCount} onboarding customers`;

  return (
    <div>
      <div className="page-header">
        <h1>Onboarding</h1>
        <p>Track onboarding progress, next steps, and go live readiness</p>
      </div>

      <div className="onboarding-filter-bar">
        <div className="onboarding-filter-controls">
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={incompleteOnly}
              onChange={(e) => handleIncompleteToggle(e.target.checked)}
            />
            Show incomplete onboarding only
          </label>
          {!loading && !error && totalCount > 0 && (
            <span className="onboarding-result-counter">{counterText}</span>
          )}
        </div>
        {incompleteOnly && (
          <div className="onboarding-filter-banner">
            Filter active: showing customers with incomplete onboarding only.
          </div>
        )}
        {actionError && (
          <p className="error-hint" style={{ marginTop: '0.75rem' }}>{actionError}</p>
        )}
      </div>

      {loading ? <LoadingState message="Loading onboarding..." /> : error ? (
        <ErrorState title="Could not load onboarding" message={error} hint="Ensure the backend is running on port 3001." />
      ) : displayedCustomers.length === 0 ? (
        <EmptyState
          title={incompleteOnly ? 'All onboarding checklists are complete' : 'No onboarding customers'}
          description={incompleteOnly
            ? 'Every customer with an onboarding checklist has finished all tasks.'
            : 'No customers are currently in onboarding.'}
        />
      ) : (
        <>
          {showOverdueSection && (
            <div className="card overdue-card">
              <div className="card-title text-danger-title">Overdue Tasks ({overdueTasks.length})</div>
              {overdueTasks.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead><tr><th>Task</th><th>Customer</th><th>Due Date</th><th>Action</th></tr></thead>
                    <tbody>
                      {overdueTasks.map((t) => (
                        <tr key={t.id}>
                          <td>{t.title}</td>
                          <td><Link to={`/customers/${t.customer_id}`} className="table-link">{t.company_name}</Link></td>
                          <td className="text-danger">{t.due_date ? formatDate(t.due_date) : 'N/A'}</td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={pendingTaskIds.has(t.id)}
                              onClick={() => toggleTask(t.id, t.completed)}
                            >
                              {pendingTaskIds.has(t.id) ? 'Completing...' : 'Mark Complete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="onboarding-overdue-empty">
                  <p><strong>No overdue tasks for incomplete onboarding customers.</strong></p>
                  <p className="muted-text">All visible customers are up to date on their onboarding deadlines.</p>
                </div>
              )}
            </div>
          )}

          <div className="onboarding-list">
            {displayedCustomers.map((c) => {
              const customerTasks = tasks.filter((t) => t.customer_id === c.id);
              const isComplete = isCompleteOnboarding(c);
              const nextStep = getOnboardingNextStep(customerTasks);
              const trackStatus = getOnboardingTrackStatus(c.progress, c.overdue_tasks);
              const upcoming = customerTasks
                .filter((t) => !t.completed && t.due_date)
                .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
              const nextDueTask = upcoming[0];
              const daysUntilDue = nextDueTask?.due_date ? getDaysUntilDue(nextDueTask.due_date) : null;
              const trackBadgeClass =
                trackStatus === 'Behind schedule'
                  ? 'badge-danger'
                  : trackStatus === 'Ready for go live review'
                    ? 'badge-success'
                    : 'badge-info';

              return (
                <div key={c.id} className="card onboarding-card">
                  <div className="onboarding-card-header">
                    <div>
                      <h2 className="onboarding-title">
                        <Link to={`/customers/${c.id}`} className="table-link">{c.company_name}</Link>
                      </h2>
                      <div className="badge-row">
                        <StatusBadge status={c.status as import('../types').CustomerStatus} />
                        <PlanBadge plan={c.plan} />
                        {isComplete && <span className="badge badge-success">Complete</span>}
                        {c.overdue_tasks > 0 && <span className="badge badge-danger">{c.overdue_tasks} overdue</span>}
                        {!isComplete && <span className={`badge ${trackBadgeClass}`}>{trackStatus}</span>}
                        <span className="badge badge-neutral">Owner: {DEMO_USER.name}</span>
                      </div>
                    </div>
                    <div className="onboarding-progress-meta">
                      <div className="progress-value">{c.progress}%</div>
                      <div className="progress-sub">{c.completed_tasks}/{c.total_tasks} tasks completed</div>
                    </div>
                  </div>

                  {isComplete ? (
                    <div className="onboarding-complete-box">
                      <strong>All tasks completed</strong>
                    </div>
                  ) : (
                    <div className="next-step-box">
                      <strong>Next step:</strong> {nextStep}
                    </div>
                  )}

                  <div className="onboarding-meta-row">
                    <span><strong>Risk level:</strong> {isComplete ? 'Complete' : trackStatus}</span>
                    <span><strong>Owner:</strong> {DEMO_USER.name}</span>
                    {!isComplete && (
                      <span><strong>Next due:</strong> {formatDaysUntilDue(daysUntilDue)}</span>
                    )}
                    <span><strong>Completed:</strong> {c.completed_tasks}/{c.total_tasks} tasks</span>
                  </div>

                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${c.progress}%` }} />
                  </div>

                  {!isComplete && nextDueTask && (
                    <p className="muted-text" style={{ marginBottom: '0.75rem' }}>
                      Next task: {nextDueTask.title}. {formatDaysUntilDue(daysUntilDue)}
                      {nextDueTask.due_date ? ` (${formatDate(nextDueTask.due_date)})` : ''}.
                    </p>
                  )}

                  <div className="task-list">
                    {customerTasks.map((t) => (
                      <div key={t.id} className="task-row">
                        <input
                          type="checkbox"
                          checked={t.completed}
                          disabled={pendingTaskIds.has(t.id)}
                          onChange={() => toggleTask(t.id, t.completed)}
                          className="task-checkbox"
                        />
                        <span className={t.completed ? 'task-done' : 'task-pending'}>{t.title}</span>
                        {t.due_date && (
                          <span className={!t.completed && new Date(t.due_date) < new Date() ? 'text-danger task-due' : 'task-due'}>
                            Due {formatDate(t.due_date)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
