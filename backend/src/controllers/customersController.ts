import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { customerSchema } from '../validators/schemas';
import {
  calculateHealthScore,
  getHealthLevel,
  getRecommendedAction,
  getCustomerSuccessSummary,
} from '../services/healthScore';
import { withDynamicOnboardingDueDates } from '../utils/onboardingDueDates';

async function enrichCustomer(customer: Record<string, unknown>) {
  const id = customer.id as number;

  const [ticketsRes, onboardingRes, latestTicketRes] = await Promise.all([
    pool.query(
      `SELECT status, priority FROM tickets WHERE customer_id = $1`,
      [id]
    ),
    pool.query(
      `SELECT completed FROM onboarding_tasks WHERE customer_id = $1`,
      [id]
    ),
    pool.query(
      `SELECT title, status FROM tickets WHERE customer_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [id]
    ),
  ]);

  const tickets = ticketsRes.rows as Array<{ status: string; priority: string }>;
  const openTickets = tickets.filter((ticket) => ticket.status !== 'resolved').length;
  const highPriorityTickets = tickets.filter(
    (ticket) => ticket.priority === 'high' && ticket.status !== 'resolved'
  ).length;
  const urgentTickets = tickets.filter(
    (ticket) => ticket.priority === 'urgent' && ticket.status !== 'resolved'
  ).length;

  const onboardingTasks = onboardingRes.rows as Array<{ completed: boolean }>;
  const onboardingProgress =
    onboardingTasks.length > 0
      ? Math.round(
          (onboardingTasks.filter((task) => task.completed).length / onboardingTasks.length) * 100
        )
      : 100;

  const latestTicket = latestTicketRes.rows[0];
  const hasUnresolvedRecentTicket =
    latestTicket && latestTicket.status !== 'resolved';

  const healthScore = calculateHealthScore({
    status: customer.status as string,
    openTickets,
    highPriorityTickets,
    urgentTickets,
    onboardingProgress,
    hasUnresolvedRecentTicket: !!hasUnresolvedRecentTicket,
  });

  const resolvedTickets = tickets.filter((ticket) => ticket.status === 'resolved').length;
  const healthLevel = getHealthLevel(healthScore);
  const recommendedAction = getRecommendedAction({
    status: customer.status as string,
    openTickets,
    urgentTickets,
    highPriorityTickets,
    onboardingProgress,
    latestTicketTitle: latestTicket?.title,
    latestTicketStatus: latestTicket?.status,
  });

  return {
    ...customer,
    health_score: healthScore,
    health_level: healthLevel,
    open_tickets_count: openTickets,
    resolved_tickets_count: resolvedTickets,
    onboarding_progress: onboardingProgress,
    recommended_action: recommendedAction,
    success_summary: getCustomerSuccessSummary({
      status: customer.status as string,
      healthScore,
      healthLevel,
      openTickets,
      urgentTickets,
      highPriorityTickets,
      onboardingProgress,
      latestTicketTitle: latestTicket?.title,
      latestTicketStatus: latestTicket?.status,
    }),
  };
}

export async function getCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, status, sort = 'created_at', order = 'desc' } = req.query;

    let query = 'SELECT * FROM customers WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (search && typeof search === 'string') {
      query += ` AND (company_name ILIKE $${paramIndex} OR contact_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status && typeof status === 'string' && status !== 'all') {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const allowedSort = ['company_name', 'health_score', 'created_at', 'status'];
    const sortField = allowedSort.includes(sort as string) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    const result = await pool.query(query, params);
    const enriched = await Promise.all(result.rows.map(enrichCustomer));

    if (sortField === 'health_score') {
      enriched.sort((a: { health_score: number }, b: { health_score: number }) =>
        sortOrder === 'ASC'
          ? a.health_score - b.health_score
          : b.health_score - a.health_score
      );
    }

    res.json(enriched);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new AppError('Customer not found', 404);
    }

    const customer = await enrichCustomer(result.rows[0]);

    const [ticketsRes, notesRes, onboardingRes] = await Promise.all([
      pool.query(
        `SELECT * FROM tickets WHERE customer_id = $1 ORDER BY created_at DESC`,
        [id]
      ),
      pool.query(
        `SELECT * FROM customer_notes WHERE customer_id = $1 ORDER BY created_at DESC`,
        [id]
      ),
      pool.query(
        `SELECT * FROM onboarding_tasks WHERE customer_id = $1 ORDER BY created_at ASC`,
        [id]
      ),
    ]);

    res.json({
      ...customer,
      tickets: ticketsRes.rows,
      notes: notesRes.rows,
      onboarding_tasks: withDynamicOnboardingDueDates(onboardingRes.rows),
    });
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const data = customerSchema.parse(req.body);
    const result = await pool.query(
      `INSERT INTO customers (company_name, contact_name, email, phone, plan, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.company_name,
        data.contact_name,
        data.email,
        data.phone ?? null,
        data.plan ?? 'starter',
        data.status ?? 'active',
      ]
    );
    const enriched = await enrichCustomer(result.rows[0]);
    res.status(201).json(enriched);
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = customerSchema.partial().parse(req.body);

    const existing = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Customer not found', 404);
    }

    const current = existing.rows[0];
    const result = await pool.query(
      `UPDATE customers SET
        company_name = $1, contact_name = $2, email = $3, phone = $4, plan = $5, status = $6
       WHERE id = $7 RETURNING *`,
      [
        data.company_name ?? current.company_name,
        data.contact_name ?? current.contact_name,
        data.email ?? current.email,
        data.phone !== undefined ? data.phone : current.phone,
        data.plan ?? current.plan,
        data.status ?? current.status,
        id,
      ]
    );

    const enriched = await enrichCustomer(result.rows[0]);
    res.json(enriched);
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      throw new AppError('Customer not found', 404);
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function addCustomerNote(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { noteSchema } = await import('../validators/schemas');
    const data = noteSchema.parse(req.body);

    const customer = await pool.query('SELECT id FROM customers WHERE id = $1', [id]);
    if (customer.rows.length === 0) {
      throw new AppError('Customer not found', 404);
    }

    const result = await pool.query(
      `INSERT INTO customer_notes (customer_id, note, created_by) VALUES ($1, $2, $3) RETURNING *`,
      [id, data.note, data.created_by]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}
