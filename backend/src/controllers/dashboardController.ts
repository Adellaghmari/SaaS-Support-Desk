import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { calculateHealthScore, getHealthLevel } from '../services/healthScore';
import { generateSupportFocus } from '../services/supportFocus';
import type { CustomerRow, EnrichedCustomer, OnboardingTaskRow, TicketRow } from '../types/models';
import {
  isOnboardingTaskOverdue,
  withDynamicOnboardingDueDates,
} from '../utils/onboardingDueDates';

function daysAgoDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const [
      customersRes,
      ticketsRes,
      onboardingRes,
      recentTicketsRes,
      overdueTasksRes,
    ] = await Promise.all([
      pool.query('SELECT * FROM customers'),
      pool.query('SELECT t.*, c.company_name FROM tickets t JOIN customers c ON t.customer_id = c.id'),
      pool.query('SELECT customer_id, completed FROM onboarding_tasks'),
      pool.query(
        `SELECT t.*, c.company_name FROM tickets t
         JOIN customers c ON t.customer_id = c.id
         ORDER BY t.created_at DESC LIMIT 8`
      ),
      pool.query(
        `SELECT ot.*, c.company_name FROM onboarding_tasks ot
         JOIN customers c ON ot.customer_id = c.id
         WHERE ot.completed = false
         ORDER BY ot.created_at ASC`
      ),
    ]);

    const customers = customersRes.rows as CustomerRow[];
    const tickets = ticketsRes.rows as TicketRow[];
    const onboardingRows = onboardingRes.rows as OnboardingTaskRow[];

    const enrichedCustomers: EnrichedCustomer[] = customers.map((customer: CustomerRow) => {
      const customerTickets = tickets.filter((ticket: TicketRow) => ticket.customer_id === customer.id);
      const openTickets = customerTickets.filter((ticket: TicketRow) => ticket.status !== 'resolved').length;
      const highPriorityTickets = customerTickets.filter(
        (ticket: TicketRow) => ticket.priority === 'high' && ticket.status !== 'resolved'
      ).length;
      const urgentTickets = customerTickets.filter(
        (ticket: TicketRow) => ticket.priority === 'urgent' && ticket.status !== 'resolved'
      ).length;

      const customerOnboarding = onboardingRows.filter(
        (task: OnboardingTaskRow) => task.customer_id === customer.id
      );
      const onboardingProgress =
        customerOnboarding.length > 0
          ? Math.round(
              (customerOnboarding.filter((task: OnboardingTaskRow) => task.completed).length /
                customerOnboarding.length) *
                100
            )
          : 100;

      const latestTicket = customerTickets.sort(
        (a: TicketRow, b: TicketRow) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      const healthScore = calculateHealthScore({
        status: customer.status,
        openTickets,
        highPriorityTickets,
        urgentTickets,
        onboardingProgress,
        hasUnresolvedRecentTicket: latestTicket && latestTicket.status !== 'resolved',
      });

      return { ...customer, health_score: healthScore, health_level: getHealthLevel(healthScore) };
    });

    const openTickets = tickets.filter((ticket: TicketRow) => ticket.status !== 'resolved');
    const highPriorityTickets = openTickets.filter(
      (ticket: TicketRow) => ticket.priority === 'high' || ticket.priority === 'urgent'
    );
    const urgentOpen = openTickets.filter((ticket: TicketRow) => ticket.priority === 'urgent');
    const resolvedTickets = tickets.filter((ticket: TicketRow) => ticket.status === 'resolved');
    const atRiskCustomers = enrichedCustomers.filter(
      (customer: EnrichedCustomer) => customer.health_level === 'at_risk' || customer.status === 'at_risk'
    );
    const onboardingCustomers = enrichedCustomers.filter(
      (customer: EnrichedCustomer) => customer.status === 'onboarding'
    );
    const avgHealthScore =
      enrichedCustomers.length > 0
        ? Math.round(
            enrichedCustomers.reduce(
              (sum: number, customer: EnrichedCustomer) => sum + customer.health_score,
              0
            ) / enrichedCustomers.length
          )
        : 0;

    const thirtyDaysAgo = daysAgoDate(30);
    const sevenDaysAgo = daysAgoDate(7);
    const customersThisMonth = customers.filter(
      (customer: CustomerRow) => new Date(customer.created_at) >= thirtyDaysAgo
    ).length;
    const resolvedThisWeek = resolvedTickets.filter(
      (ticket: TicketRow) => new Date(ticket.updated_at) >= sevenDaysAgo
    ).length;
    const urgentToday = urgentOpen.filter(
      (ticket: TicketRow) => new Date(ticket.updated_at) >= daysAgoDate(1)
    ).length;
    const waitingTickets = openTickets.filter(
      (ticket: TicketRow) => ticket.status === 'waiting_for_customer'
    );
    const healthImprovement = Math.max(0, avgHealthScore - 41);

    const statusBreakdown = {
      open: tickets.filter((ticket: TicketRow) => ticket.status === 'open').length,
      in_progress: tickets.filter((ticket: TicketRow) => ticket.status === 'in_progress').length,
      waiting_for_customer: waitingTickets.length,
      resolved: resolvedTickets.length,
    };

    const lowHealthCustomers = enrichedCustomers
      .filter((customer: EnrichedCustomer) => customer.health_score < 50)
      .sort((a: EnrichedCustomer, b: EnrichedCustomer) => a.health_score - b.health_score)
      .slice(0, 6);

    const atRiskList = atRiskCustomers
      .sort((a: EnrichedCustomer, b: EnrichedCustomer) => a.health_score - b.health_score)
      .slice(0, 6);

    const healthOverview = {
      healthy: enrichedCustomers.filter((customer: EnrichedCustomer) => customer.health_level === 'healthy')
        .length,
      needs_attention: enrichedCustomers.filter(
        (customer: EnrichedCustomer) => customer.health_level === 'needs_attention'
      ).length,
      at_risk: enrichedCustomers.filter((customer: EnrichedCustomer) => customer.health_level === 'at_risk')
        .length,
    };

    const overdueOnboardingTasks = withDynamicOnboardingDueDates(
      overdueTasksRes.rows as OnboardingTaskRow[]
    )
      .filter((task) => isOnboardingTaskOverdue(task))
      .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
      .slice(0, 10);

    const supportFocus = generateSupportFocus({
      atRiskCustomers: atRiskList,
      urgentTickets: urgentOpen,
      highPriorityTickets: highPriorityTickets.filter((ticket: TicketRow) => ticket.priority === 'high'),
      overdueOnboarding: overdueOnboardingTasks,
      waitingTickets,
    });

    res.json({
      stats: {
        total_customers: customers.length,
        open_tickets: openTickets.length,
        high_priority_tickets: highPriorityTickets.length,
        customers_at_risk: atRiskCustomers.length,
        onboarding_customers: onboardingCustomers.length,
        resolved_tickets: resolvedTickets.length,
        average_health_score: avgHealthScore,
      },
      trends: {
        total_customers: customersThisMonth > 0 ? `+${customersThisMonth} this month` : 'Stable this month',
        open_tickets: resolvedThisWeek > 0 ? `-${resolvedThisWeek} this week` : 'No change this week',
        high_priority_tickets: urgentToday > 0 ? `${urgentToday} need attention today` : `${highPriorityTickets.length} need attention`,
        customers_at_risk: atRiskCustomers.length > 0 ? `${atRiskCustomers.length} require follow up` : 'No accounts at risk',
        onboarding_customers: `${onboardingCustomers.length} in active setup`,
        resolved_tickets: resolvedThisWeek > 0 ? `+${resolvedThisWeek} closed this week` : 'Steady resolution pace',
        average_health_score: healthImprovement > 0 ? `Improved by ${healthImprovement} points` : 'Holding steady',
      },
      support_focus: supportFocus,
      status_breakdown: statusBreakdown,
      health_overview: healthOverview,
      recent_tickets: recentTicketsRes.rows,
      low_health_customers: lowHealthCustomers,
      at_risk_customers: atRiskList,
      overdue_onboarding_tasks: overdueOnboardingTasks,
    });
  } catch (err) {
    next(err);
  }
}
