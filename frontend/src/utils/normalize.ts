import type { Customer, SupportFocusItem, Ticket, CustomerSuccessSummary } from '../types';
import { DEMO_USER } from '../constants/demoUser';

function parseLegacyFocusItem(text: string, tickets?: Ticket[]): SupportFocusItem {
  const quoted = text.match(/"([^"]+)"/);
  const ticketTitle = quoted?.[1];
  const ticket = ticketTitle ? tickets?.find((t) => t.title === ticketTitle) : undefined;

  let customer = 'Support queue';
  let reason = 'Action recommended today';
  let action = 'Review and follow up';
  let priority: SupportFocusItem['priority'] = 'medium';
  let related_task: string | null = null;

  if (/critically low/i.test(text)) {
    const nameMatch = text.match(/Follow up with\s+([^"]+?)\s+because/i);
    customer = nameMatch?.[1]?.trim() || customer;
    reason = 'Health score is critically low';
    action = 'Review open tickets and schedule retention call';
    priority = 'high';
  } else if (/urgent ticket/i.test(text)) {
    const forMatch = text.match(/for\s+([^"]+)$/i);
    customer = forMatch?.[1]?.trim() || customer;
    reason = 'Urgent open ticket';
    action = ticketTitle ? `Review "${ticketTitle}" today` : 'Review urgent ticket today';
    priority = 'urgent';
  } else if (/overdue onboarding/i.test(text)) {
    const taskMatch = text.match(/task\s+"([^"]+)"/i);
    const forMatch = text.match(/for\s+([^"]+)$/i);
    customer = forMatch?.[1]?.trim() || customer;
    related_task = taskMatch?.[1] || null;
    reason = 'Overdue onboarding task';
    action = related_task ? `Complete ${related_task} follow up` : 'Complete overdue onboarding follow up';
    priority = 'high';
  } else if (/waiting for customer/i.test(text)) {
    const countMatch = text.match(/(\d+)\s+ticket/i);
    reason = countMatch
      ? `${countMatch[1]} ticket${countMatch[1] === '1' ? '' : 's'} waiting on customer`
      : 'Tickets waiting on customer';
    action = 'Send follow up reminders before end of day';
    priority = 'medium';
    customer = 'Multiple customers';
  } else if (/high priority/i.test(text)) {
    const forMatch = text.match(/for\s+([^"]+)$/i);
    customer = forMatch?.[1]?.trim() || customer;
    reason = 'High priority ticket open';
    action = ticketTitle ? `Confirm next steps on "${ticketTitle}"` : 'Confirm next steps on open ticket';
    priority = 'high';
  } else if (/onboarding check in/i.test(text)) {
    const nameMatch = text.match(/with\s+([^"]+)$/i);
    customer = nameMatch?.[1]?.trim() || customer;
    reason = 'Onboarding needs attention';
    action = 'Schedule onboarding check in with stakeholders';
    priority = 'medium';
  }

  return {
    priority,
    customer,
    reason,
    recommended_action: action,
    related_ticket: ticket ? { id: ticket.id, title: ticket.title } : null,
    related_task,
  };
}

export function normalizeSupportFocus(
  items: unknown,
  context?: {
    recent_tickets?: Ticket[];
    at_risk_customers?: Customer[];
  }
): SupportFocusItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return buildFallbackSupportFocus(context);
  }

  if (typeof items[0] === 'string') {
    return (items as string[]).map((text) =>
      parseLegacyFocusItem(text, context?.recent_tickets)
    );
  }

  return (items as SupportFocusItem[]).map((item) => ({
    priority: item.priority || 'medium',
    customer: item.customer || 'Support queue',
    customer_id: item.customer_id,
    reason: item.reason || 'Action recommended',
    recommended_action: item.recommended_action || 'Review and follow up',
    related_ticket: item.related_ticket ?? null,
    related_task: item.related_task ?? null,
  }));
}

export function buildFallbackSupportFocus(context?: {
  recent_tickets?: Ticket[];
  at_risk_customers?: Customer[];
}): SupportFocusItem[] {
  const items: SupportFocusItem[] = [];

  for (const c of (context?.at_risk_customers ?? []).slice(0, 2)) {
    items.push({
      priority: 'high',
      customer: c.company_name,
      customer_id: c.id,
      reason: 'Health score is critically low',
      recommended_action: 'Review open tickets and schedule retention call',
      related_ticket: null,
    });
  }

  for (const t of (context?.recent_tickets ?? []).filter((ticket) => ticket.priority === 'urgent').slice(0, 2)) {
    items.push({
      priority: 'urgent',
      customer: t.company_name || 'Unknown customer',
      customer_id: t.customer_id,
      reason: 'Urgent open ticket',
      recommended_action: `Review "${t.title}" today`,
      related_ticket: { id: t.id, title: t.title },
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

export function buildCustomerSuccessSummary(
  customer: {
    health_score?: number;
    recommended_action?: string;
    success_summary?: CustomerSuccessSummary;
  }
): CustomerSuccessSummary {
  if (customer.success_summary) {
    return {
      health_reason: customer.success_summary.health_reason || 'Health data unavailable',
      main_risk: customer.success_summary.main_risk || 'No immediate risk identified',
      next_step: customer.success_summary.next_step || customer.recommended_action || 'No next action available',
      owner: customer.success_summary.owner || DEMO_USER.name,
    };
  }

  return {
    health_reason: customer.health_score != null
      ? `Health score is ${customer.health_score}`
      : 'Health data unavailable',
    main_risk: 'Review customer activity for potential risks',
    next_step: customer.recommended_action || 'No next action available',
    owner: DEMO_USER.name,
  };
}
