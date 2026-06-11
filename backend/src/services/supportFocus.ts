interface FocusCustomer {
  id: number;
  company_name: string;
  health_score: number;
  health_level?: string;
  status: string;
}

interface FocusTicket {
  id: number;
  title: string;
  company_name?: string;
  customer_id?: number;
  priority: string;
  status: string;
}

interface FocusOnboardingTask {
  title: string;
  company_name?: string;
  customer_id: number;
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

export function generateSupportFocus(data: {
  atRiskCustomers: FocusCustomer[];
  urgentTickets: FocusTicket[];
  highPriorityTickets: FocusTicket[];
  overdueOnboarding: FocusOnboardingTask[];
  waitingTickets: FocusTicket[];
}): SupportFocusItem[] {
  const items: SupportFocusItem[] = [];

  for (const c of data.atRiskCustomers.slice(0, 2)) {
    items.push({
      priority: 'high',
      customer: c.company_name,
      customer_id: c.id,
      reason: 'Health score is critically low',
      recommended_action: 'Review open tickets and schedule retention call',
      related_ticket: null,
    });
  }

  for (const t of data.urgentTickets.slice(0, 2)) {
    items.push({
      priority: 'urgent',
      customer: t.company_name || 'Unknown customer',
      customer_id: t.customer_id,
      reason: 'Urgent open ticket',
      recommended_action: `Review "${t.title}" today`,
      related_ticket: { id: t.id, title: t.title },
    });
  }

  for (const t of data.overdueOnboarding.slice(0, 2)) {
    items.push({
      priority: 'high',
      customer: t.company_name || 'Unknown customer',
      customer_id: t.customer_id,
      reason: 'Overdue onboarding task',
      recommended_action: `Complete ${t.title} follow up`,
      related_ticket: null,
      related_task: t.title,
    });
  }

  if (data.waitingTickets.length > 0) {
    const waiting = data.waitingTickets[0];
    items.push({
      priority: 'medium',
      customer: waiting.company_name || 'Multiple customers',
      customer_id: waiting.customer_id,
      reason: `${data.waitingTickets.length} ticket${data.waitingTickets.length > 1 ? 's' : ''} waiting on customer`,
      recommended_action: 'Send follow up reminders before end of day',
      related_ticket: { id: waiting.id, title: waiting.title },
    });
  }

  for (const t of data.highPriorityTickets.slice(0, 1)) {
    if (!items.some((i) => i.related_ticket?.id === t.id)) {
      items.push({
        priority: 'high',
        customer: t.company_name || 'Unknown customer',
        customer_id: t.customer_id,
        reason: 'High priority ticket open',
        recommended_action: `Confirm next steps on "${t.title}"`,
        related_ticket: { id: t.id, title: t.title },
      });
    }
  }

  const onboardingCustomers = data.atRiskCustomers.filter((c) => c.status === 'onboarding');
  if (onboardingCustomers.length > 0 && items.length < 5) {
    const c = onboardingCustomers[0];
    items.push({
      priority: 'medium',
      customer: c.company_name,
      customer_id: c.id,
      reason: 'Onboarding needs attention',
      recommended_action: 'Schedule onboarding check in with stakeholders',
      related_ticket: null,
    });
  }

  if (items.length === 0) {
    items.push({
      priority: 'low',
      customer: 'All accounts',
      reason: 'No urgent actions flagged',
      recommended_action: 'Review open tickets and plan proactive outreach',
      related_ticket: null,
    });
  }

  return items.slice(0, 5);
}
