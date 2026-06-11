export interface CustomerRow {
  id: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string | null;
  plan: string;
  status: string;
  created_at: string | Date;
  updated_at?: string | Date;
}

export interface TicketRow {
  id: number;
  customer_id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assigned_to?: string | null;
  company_name?: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface OnboardingTaskRow {
  id?: number;
  customer_id: number;
  title: string;
  completed: boolean;
  due_date?: string | Date | null;
  company_name?: string;
}

export interface EnrichedCustomer extends CustomerRow {
  health_score: number;
  health_level: string;
}
