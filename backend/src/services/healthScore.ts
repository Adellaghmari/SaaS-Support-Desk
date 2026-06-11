export type HealthLevel = 'healthy' | 'needs_attention' | 'at_risk';

export interface HealthInput {
  status: string;
  openTickets: number;
  highPriorityTickets: number;
  urgentTickets: number;
  onboardingProgress: number;
  hasUnresolvedRecentTicket: boolean;
}

export function calculateHealthScore(input: HealthInput): number {
  let score = 75;

  if (input.status === 'active') score += 10;
  if (input.status === 'onboarding') score -= 5;
  if (input.status === 'at_risk') score -= 25;
  if (input.status === 'inactive') score -= 40;

  score -= input.openTickets * 5;
  score -= input.highPriorityTickets * 8;
  score -= input.urgentTickets * 15;

  if (input.onboardingProgress >= 100) score += 10;
  else if (input.onboardingProgress >= 50) score += 5;
  else if (input.onboardingProgress < 30) score -= 10;

  if (input.hasUnresolvedRecentTicket) score -= 10;
  if (input.openTickets === 0 && input.status === 'active') score += 10;

  return Math.max(0, Math.min(100, score));
}

export function getHealthLevel(score: number): HealthLevel {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'needs_attention';
  return 'at_risk';
}

export function getRecommendedAction(data: {
  status: string;
  openTickets: number;
  urgentTickets: number;
  highPriorityTickets: number;
  onboardingProgress: number;
  latestTicketTitle?: string;
  latestTicketStatus?: string;
}): string {
  if (data.urgentTickets > 0) {
    return 'Escalate and follow up on urgent open ticket immediately';
  }
  if (data.highPriorityTickets > 0) {
    return 'Follow up with customer about unresolved high priority issue';
  }
  if (data.status === 'onboarding' && data.onboardingProgress < 100) {
    if (data.onboardingProgress < 50) {
      return 'Schedule onboarding check in and assist with setup tasks';
    }
    return 'Complete remaining onboarding tasks before go live';
  }
  if (data.openTickets > 0 && data.latestTicketTitle) {
    return `Follow up on "${data.latestTicketTitle}" (status: ${data.latestTicketStatus})`;
  }
  if (data.status === 'at_risk') {
    return 'Schedule customer success call to address retention risk';
  }
  if (data.status === 'active' && data.openTickets === 0) {
    return 'Customer health is strong. No immediate action needed.';
  }
  return 'Review customer activity and plan proactive outreach';
}

export interface CustomerSuccessSummary {
  health_reason: string;
  main_risk: string;
  next_step: string;
  owner: string;
}

export function getCustomerSuccessSummary(params: {
  status: string;
  healthScore: number;
  healthLevel: HealthLevel;
  openTickets: number;
  urgentTickets: number;
  highPriorityTickets: number;
  onboardingProgress: number;
  latestTicketTitle?: string;
  latestTicketStatus?: string;
  owner?: string;
}): CustomerSuccessSummary {
  const reasons: string[] = [];

  if (params.status === 'at_risk') reasons.push('Account status is flagged as at risk');
  if (params.status === 'inactive') reasons.push('Account is inactive');
  if (params.openTickets > 0) {
    reasons.push(`${params.openTickets} open support ticket${params.openTickets > 1 ? 's' : ''}`);
  }
  if (params.status === 'onboarding' && params.onboardingProgress < 100) {
    reasons.push(`Onboarding is ${params.onboardingProgress}% complete`);
  }
  if (params.urgentTickets > 0) {
    reasons.push(`${params.urgentTickets} urgent ticket${params.urgentTickets > 1 ? 's' : ''} open`);
  }

  const health_reason =
    reasons.length > 0
      ? reasons.join('. ')
      : `Health score is ${params.healthScore} with no open support issues`;

  let main_risk = 'No immediate retention risk identified';
  if (params.urgentTickets > 0) {
    main_risk = 'Unresolved urgent ticket may impact customer trust';
  } else if (params.status === 'at_risk') {
    main_risk = 'Retention risk requires proactive outreach';
  } else if (params.highPriorityTickets > 0) {
    main_risk = 'High priority issues are still open';
  } else if (params.status === 'onboarding' && params.onboardingProgress < 50) {
    main_risk = 'Slow onboarding may delay go live';
  }

  const next_step = getRecommendedAction({
    status: params.status,
    openTickets: params.openTickets,
    urgentTickets: params.urgentTickets,
    highPriorityTickets: params.highPriorityTickets,
    onboardingProgress: params.onboardingProgress,
    latestTicketTitle: params.latestTicketTitle,
    latestTicketStatus: params.latestTicketStatus,
  });

  return {
    health_reason,
    main_risk,
    next_step,
    owner: params.owner || 'Adel Laghmari',
  };
}
