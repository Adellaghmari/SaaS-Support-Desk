export type CustomerStatus = 'active' | 'onboarding' | 'at_risk' | 'inactive';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory =
  | 'technical_issue'
  | 'billing'
  | 'onboarding'
  | 'feature_request'
  | 'account_access'
  | 'general_question';
export type HealthLevel = 'healthy' | 'needs_attention' | 'at_risk';

export interface CustomerSuccessSummary {
  health_reason: string;
  main_risk: string;
  next_step: string;
  owner: string;
}

export interface Customer {
  id: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  plan: string;
  status: CustomerStatus;
  health_score: number;
  health_level?: HealthLevel;
  open_tickets_count?: number;
  resolved_tickets_count?: number;
  onboarding_progress?: number;
  recommended_action?: string;
  success_summary?: CustomerSuccessSummary;
  created_at: string;
}

export interface CustomerDetail extends Customer {
  tickets: Ticket[];
  notes: CustomerNote[];
  onboarding_tasks: OnboardingTask[];
}

export interface Ticket {
  id: number;
  customer_id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assigned_to: string | null;
  company_name?: string;
  contact_name?: string;
  customer_email?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  author: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface OnboardingTask {
  id: number;
  customer_id: number;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  company_name?: string;
}

export interface CustomerNote {
  id: number;
  customer_id: number;
  note: string;
  created_by: string;
  created_at: string;
}

export interface KnowledgeArticle {
  id: number;
  title: string;
  category: string;
  content: string;
  usage_note?: string | null;
  support_note?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SupportFocusItem {
  priority: 'urgent' | 'high' | 'medium' | 'low';
  customer: string;
  customer_id?: number;
  reason: string;
  recommended_action: string;
  related_ticket: { id: number; title: string } | null;
  related_task?: string | null;
}

export interface DashboardData {
  stats: {
    total_customers: number;
    open_tickets: number;
    high_priority_tickets: number;
    customers_at_risk: number;
    onboarding_customers: number;
    resolved_tickets: number;
    average_health_score: number;
  };
  status_breakdown: Record<TicketStatus, number>;
  health_overview: {
    healthy: number;
    needs_attention: number;
    at_risk: number;
  };
  recent_tickets: Ticket[];
  low_health_customers: Customer[];
  at_risk_customers: Customer[];
  overdue_onboarding_tasks: OnboardingTask[];
  trends: Record<string, string>;
  support_focus: SupportFocusItem[] | string[];
}
