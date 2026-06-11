import { z } from 'zod';

export const customerSchema = z.object({
  company_name: z.string().min(1).max(255),
  contact_name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().max(50).optional().nullable(),
  plan: z.enum(['starter', 'professional', 'enterprise']).optional(),
  status: z.enum(['active', 'onboarding', 'at_risk', 'inactive']).optional(),
});

export const ticketSchema = z.object({
  customer_id: z.number().int().positive(),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  status: z.enum(['open', 'in_progress', 'waiting_for_customer', 'resolved']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.enum([
    'technical_issue', 'billing', 'onboarding', 'feature_request', 'account_access', 'general_question',
  ]).optional(),
  assigned_to: z.string().max(100).optional().nullable(),
});

export const ticketUpdateSchema = ticketSchema.partial().omit({ customer_id: true });

export const commentSchema = z.object({
  author: z.string().min(1).max(100),
  message: z.string().min(1),
  is_internal: z.boolean().optional(),
});

export const articleSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  content: z.string().min(1),
});

export const noteSchema = z.object({
  note: z.string().min(1),
  created_by: z.string().min(1).max(100),
});
