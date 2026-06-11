import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { AppError } from '../middleware/errorHandler';
import {
  calcOnboardingProgress,
  isIncompleteOnboarding,
} from '../utils/onboardingProgress';
import {
  isOnboardingTaskOverdue,
  withDynamicOnboardingDueDates,
} from '../utils/onboardingDueDates';
import type { OnboardingTaskRow } from '../types/models';

interface OnboardingCustomerRow {
  id: number;
  company_name: string;
  contact_name: string;
  status: string;
  plan: string;
}

interface OnboardingCustomerSummary extends OnboardingCustomerRow {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  progress: number;
}

export async function getOnboardingByCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const customer = await pool.query('SELECT id FROM customers WHERE id = $1', [id]);
    if (customer.rows.length === 0) {
      throw new AppError('Customer not found', 404);
    }

    const result = await pool.query(
      'SELECT * FROM onboarding_tasks WHERE customer_id = $1 ORDER BY created_at ASC',
      [id]
    );

    const tasks = withDynamicOnboardingDueDates(result.rows);
    const { completed_tasks, progress, total_tasks } = calcOnboardingProgress(tasks);

    res.json({ tasks, progress, completed: completed_tasks, total: total_tasks });
  } catch (err) {
    next(err);
  }
}

export async function getAllOnboarding(req: Request, res: Response, next: NextFunction) {
  try {
    const { incomplete } = req.query;

    const [customersRes, tasksRes] = await Promise.all([
      pool.query(`
        SELECT c.id, c.company_name, c.contact_name, c.status, c.plan
        FROM customers c
        WHERE c.status = 'onboarding'
           OR c.id IN (SELECT DISTINCT customer_id FROM onboarding_tasks)
        ORDER BY c.company_name ASC
      `),
      pool.query(`
        SELECT ot.*, c.company_name FROM onboarding_tasks ot
        JOIN customers c ON ot.customer_id = c.id
        ORDER BY ot.due_date ASC NULLS LAST
      `),
    ]);

    const tasks = withDynamicOnboardingDueDates(tasksRes.rows as OnboardingTaskRow[]);
    const customerRows = customersRes.rows as OnboardingCustomerRow[];

    let customers: OnboardingCustomerSummary[] = customerRows
      .map((customer: OnboardingCustomerRow) => {
        const customerTasks = tasks.filter((task: OnboardingTaskRow) => task.customer_id === customer.id);
        const { total_tasks, completed_tasks, progress } = calcOnboardingProgress(customerTasks);
        const overdue_tasks = customerTasks.filter((task: OnboardingTaskRow) =>
          isOnboardingTaskOverdue(task)
        ).length;

        return {
          ...customer,
          total_tasks,
          completed_tasks,
          overdue_tasks,
          progress,
        };
      })
      .filter((customer: OnboardingCustomerSummary) => customer.total_tasks > 0);

    if (incomplete === 'true') {
      customers = customers.filter(isIncompleteOnboarding);
    }

    res.json({ customers, tasks });
  } catch (err) {
    next(err);
  }
}

export async function updateOnboardingTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { taskId } = req.params;
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
      throw new AppError('completed must be a boolean', 400);
    }

    const result = await pool.query(
      'UPDATE onboarding_tasks SET completed = $1 WHERE id = $2 RETURNING *',
      [completed, taskId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Onboarding task not found', 404);
    }

    res.json(withDynamicOnboardingDueDates([result.rows[0]])[0]);
  } catch (err) {
    next(err);
  }
}
