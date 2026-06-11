import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { articleSchema } from '../validators/schemas';

export async function getArticles(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, category } = req.query;

    let query = 'SELECT * FROM knowledge_articles WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (search && typeof search === 'string') {
      query += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category && typeof category === 'string' && category !== 'all') {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getArticleById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM knowledge_articles WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new AppError('Article not found', 404);
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function createArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const data = articleSchema.parse(req.body);
    const result = await pool.query(
      'INSERT INTO knowledge_articles (title, category, content) VALUES ($1, $2, $3) RETURNING *',
      [data.title, data.category, data.content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function updateArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = articleSchema.partial().parse(req.body);

    const existing = await pool.query('SELECT * FROM knowledge_articles WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Article not found', 404);
    }

    const current = existing.rows[0];
    const result = await pool.query(
      `UPDATE knowledge_articles SET title = $1, category = $2, content = $3 WHERE id = $4 RETURNING *`,
      [
        data.title ?? current.title,
        data.category ?? current.category,
        data.content ?? current.content,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function deleteArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM knowledge_articles WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      throw new AppError('Article not found', 404);
    }

    res.json({ message: 'Article deleted successfully' });
  } catch (err) {
    next(err);
  }
}
