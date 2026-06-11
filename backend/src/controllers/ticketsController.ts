import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { ticketSchema, ticketUpdateSchema } from '../validators/schemas';

const TICKET_SELECT = `
  SELECT t.*, c.company_name, c.contact_name, c.email as customer_email
  FROM tickets t
  JOIN customers c ON t.customer_id = c.id
`;

export async function getTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, status, priority, category, sort = 'created_at', order = 'desc' } = req.query;

    let query = `${TICKET_SELECT} WHERE 1=1`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (search && typeof search === 'string') {
      query += ` AND (t.title ILIKE $${paramIndex} OR c.company_name ILIKE $${paramIndex} OR t.category ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status && typeof status === 'string' && status !== 'all') {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority && typeof priority === 'string' && priority !== 'all') {
      query += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (category && typeof category === 'string' && category !== 'all') {
      query += ` AND t.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    const allowedSort = ['created_at', 'priority', 'status', 'updated_at'];
    const sortField = allowedSort.includes(sort as string) ? `t.${sort}` : 't.created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    if (sort === 'priority') {
      query += ` ORDER BY CASE t.priority
        WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END ${sortOrder}`;
    } else {
      query += ` ORDER BY ${sortField} ${sortOrder}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getTicketById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await pool.query(`${TICKET_SELECT} WHERE t.id = $1`, [id]);

    if (result.rows.length === 0) {
      throw new AppError('Ticket not found', 404);
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function createTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const data = ticketSchema.parse(req.body);

    const customer = await pool.query('SELECT id FROM customers WHERE id = $1', [data.customer_id]);
    if (customer.rows.length === 0) {
      throw new AppError('Customer not found', 404);
    }

    const result = await pool.query(
      `INSERT INTO tickets (customer_id, title, description, status, priority, category, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        data.customer_id,
        data.title,
        data.description,
        data.status ?? 'open',
        data.priority ?? 'medium',
        data.category ?? 'general_question',
        data.assigned_to ?? 'Support Team',
      ]
    );

    const full = await pool.query(`${TICKET_SELECT} WHERE t.id = $1`, [result.rows[0].id]);
    res.status(201).json(full.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function updateTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = ticketUpdateSchema.parse(req.body);

    const existing = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Ticket not found', 404);
    }

    const current = existing.rows[0];
    await pool.query(
      `UPDATE tickets SET
        title = $1, description = $2, status = $3, priority = $4,
        category = $5, assigned_to = $6, updated_at = NOW()
       WHERE id = $7`,
      [
        data.title ?? current.title,
        data.description ?? current.description,
        data.status ?? current.status,
        data.priority ?? current.priority,
        data.category ?? current.category,
        data.assigned_to !== undefined ? data.assigned_to : current.assigned_to,
        id,
      ]
    );

    const full = await pool.query(`${TICKET_SELECT} WHERE t.id = $1`, [id]);
    res.json(full.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function deleteTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      throw new AppError('Ticket not found', 404);
    }

    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    next(err);
  }
}
