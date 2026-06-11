import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { commentSchema } from '../validators/schemas';

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const ticket = await pool.query('SELECT id FROM tickets WHERE id = $1', [id]);
    if (ticket.rows.length === 0) {
      throw new AppError('Ticket not found', 404);
    }

    const result = await pool.query(
      'SELECT * FROM ticket_comments WHERE ticket_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function createComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = commentSchema.parse(req.body);

    const ticket = await pool.query('SELECT id FROM tickets WHERE id = $1', [id]);
    if (ticket.rows.length === 0) {
      throw new AppError('Ticket not found', 404);
    }

    const result = await pool.query(
      `INSERT INTO ticket_comments (ticket_id, author, message, is_internal)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, data.author, data.message, data.is_internal ?? false]
    );

    await pool.query('UPDATE tickets SET updated_at = NOW() WHERE id = $1', [id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}
