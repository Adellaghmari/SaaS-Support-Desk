import { Pool } from 'pg';
import { daysAgo, daysFromNow, hoursAfter } from '../utils/seedDates';
import { ONBOARDING_TASK_DUE_OFFSETS } from '../utils/onboardingDueDates';

const SUPPORT_TEAM = ['Adel Laghmari', 'Sara Lindqvist', 'James Chen', 'Emma Nilsson'];

const CUSTOMER_CREATED_DAYS = [240, 210, 185, 160, 140, 120, 95, 75, 60, 45, 30, 12];

async function clearDemoData(pool: Pool): Promise<void> {
  const tables = [
    'ticket_comments',
    'tickets',
    'onboarding_tasks',
    'customer_notes',
    'knowledge_articles',
    'customers',
    'users',
  ];
  for (const table of tables) {
    await pool.query(`DELETE FROM ${table}`);
  }
}

type TicketSeed = [number, string, string, string, string, string, number, number];

export async function runSeed(pool: Pool, options?: { clear?: boolean }): Promise<void> {
  if (options?.clear) {
    await clearDemoData(pool);
  }

  await pool.query(`
    INSERT INTO users (name, email, role) VALUES
    ('Adel Laghmari', 'adel@supportdesk.io', 'support_lead'),
    ('Sara Lindqvist', 'sara@supportdesk.io', 'support_agent'),
    ('James Chen', 'james@supportdesk.io', 'support_agent'),
    ('Emma Nilsson', 'emma@supportdesk.io', 'customer_success')
  `);

  const customerRows = [
    ['Nordic Retail Group', 'Erik Johansson', 'erik@nordicretail.se', '+46 70 123 4567', 'enterprise', 'active', 82],
    ['Flowdesk AB', 'Anna Bergström', 'anna@flowdesk.se', '+46 70 234 5678', 'professional', 'active', 75],
    ['Bright CRM', 'Michael Torres', 'michael@brightcrm.com', '+1 415 555 0101', 'enterprise', 'at_risk', 38],
    ['Klara Logistics', 'Klara Andersson', 'klara@klaralogistics.se', '+46 70 345 6789', 'professional', 'onboarding', 55],
    ['ScalePoint SaaS', 'David Kim', 'david@scalepoint.io', '+1 650 555 0202', 'enterprise', 'active', 88],
    ['Urban Analytics', 'Lisa Park', 'lisa@urbananalytics.com', '+1 212 555 0303', 'starter', 'active', 72],
    ['CloudBridge Solutions', 'Tom Richardson', 'tom@cloudbridge.io', '+44 20 7946 0958', 'professional', 'active', 79],
    ['Supportly Systems', 'Nina Holm', 'nina@supportly.se', '+46 70 456 7890', 'enterprise', 'onboarding', 48],
    ['Nordic HealthTech', 'Rachel Green', 'rachel@nordichealth.io', '+46 70 567 8901', 'enterprise', 'active', 91],
    ['RetailSync', 'Oscar Lind', 'oscar@retailsync.se', '+46 70 678 9012', 'professional', 'at_risk', 32],
    ['InvoicePilot', 'Chris Walker', 'chris@invoicepilot.com', '+1 503 555 0505', 'starter', 'inactive', 20],
    ['TeamDesk Pro', 'Helena Vogt', 'helena@teamdesk.pro', '+49 30 12345678', 'professional', 'onboarding', 52],
  ];

  const customerIds: number[] = [];
  for (let i = 0; i < customerRows.length; i++) {
    const [company, contact, email, phone, plan, status, health] = customerRows[i];
    const result = await pool.query(
      `INSERT INTO customers (company_name, contact_name, email, phone, plan, status, health_score, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [company, contact, email, phone, plan, status, health, daysAgo(CUSTOMER_CREATED_DAYS[i])]
    );
    customerIds.push(result.rows[0].id);
  }

  const ticketData: TicketSeed[] = [
    [0, 'User cannot access dashboard', 'Multiple users report 403 errors when accessing the main dashboard after the latest update.', 'open', 'high', 'technical_issue', 2, 1],
    [0, 'Billing plan mismatch', 'Customer was charged for Enterprise plan but account shows Professional tier.', 'in_progress', 'high', 'billing', 18, 3],
    [1, 'Webhook integration failing', 'Outbound webhooks to their CRM stop firing after 30 minutes of uptime.', 'open', 'urgent', 'technical_issue', 1, 0],
    [1, 'Export feature request', 'Customer needs CSV export for quarterly reporting with custom date ranges.', 'open', 'low', 'feature_request', 21, 21],
    [2, 'API token expired', 'Production API tokens are expiring before the documented 90-day period.', 'in_progress', 'urgent', 'technical_issue', 4, 1],
    [2, 'Slow loading customer page', 'Customer list page takes 8+ seconds to load with 500+ records.', 'waiting_for_customer', 'medium', 'technical_issue', 14, 5],
    [2, 'Account permissions issue', 'Team lead cannot assign roles to new team members after org restructure.', 'open', 'high', 'account_access', 6, 6],
    [3, 'Customer needs onboarding help', 'New admin unable to complete SSO configuration for Azure AD.', 'in_progress', 'medium', 'onboarding', 9, 2],
    [3, 'First login completed verification', 'Confirm first admin login and initial workspace setup.', 'resolved', 'low', 'onboarding', 45, 38],
    [4, 'SSO configuration assistance', 'Need help mapping SAML attributes for Okta integration.', 'resolved', 'medium', 'onboarding', 62, 55],
    [4, 'Data migration support', 'Assistance needed migrating 12,000 records from legacy system.', 'in_progress', 'high', 'technical_issue', 11, 2],
    [5, 'Invoice download not working', 'PDF invoices return blank pages in Chrome and Edge browsers.', 'open', 'medium', 'billing', 8, 8],
    [5, 'General question about API limits', 'Clarification needed on rate limits for Starter plan API usage.', 'resolved', 'low', 'general_question', 55, 48],
    [6, 'Integration setup unclear', 'Slack notification integration drops messages during peak hours.', 'open', 'high', 'technical_issue', 5, 4],
    [6, 'Custom domain setup', 'Help configuring custom domain with SSL certificate.', 'in_progress', 'medium', 'onboarding', 16, 3],
    [7, 'Onboarding kickoff scheduling', 'Schedule intro call and technical setup session.', 'open', 'medium', 'onboarding', 12, 12],
    [7, 'Team invitation workflow', 'Bulk invite CSV upload returns validation errors.', 'in_progress', 'medium', 'onboarding', 7, 1],
    [8, 'Login problem after password reset', 'Users locked out after mandatory password reset campaign.', 'open', 'urgent', 'account_access', 3, 2],
    [9, 'Renewal discussion follow up', 'Customer expressed concerns about pricing at last QBR.', 'waiting_for_customer', 'high', 'billing', 20, 12],
    [9, 'HIPAA compliance documentation', 'Request for updated BAA and compliance documentation package.', 'resolved', 'medium', 'general_question', 70, 63],
    [9, 'Audit log export feature', 'Need ability to export audit logs for compliance review.', 'open', 'low', 'feature_request', 25, 25],
    [10, 'Account reactivation request', 'Former customer wants to reactivate subscription with historical data.', 'open', 'medium', 'account_access', 35, 35],
    [11, 'Technical setup for ERP integration', 'Connect SAP ERP module for inventory sync.', 'in_progress', 'high', 'technical_issue', 10, 2],
    [11, 'Training session scheduling', 'Schedule team training for 15 users before go live.', 'open', 'medium', 'onboarding', 6, 6],
    [4, 'Performance degradation report', 'Dashboard widgets loading 3x slower since last deployment.', 'open', 'high', 'technical_issue', 4, 3],
    [0, 'Mobile app login issue', 'iOS app users cannot complete MFA verification step.', 'in_progress', 'high', 'technical_issue', 9, 1],
    [1, 'Notification preferences reset', 'User notification settings revert to defaults after each login.', 'open', 'medium', 'technical_issue', 13, 13],
    [6, 'Two-factor authentication setup', 'Enterprise customer needs enforced 2FA for all users.', 'resolved', 'medium', 'account_access', 40, 32],
    [3, 'Go live readiness review', 'Final checklist review before production launch.', 'open', 'high', 'onboarding', 5, 5],
    [9, 'Export feature request', 'Export support ticket history for internal analytics.', 'open', 'low', 'feature_request', 28, 28],
  ];

  const ticketIds: number[] = [];
  const ticketTimestamps: string[] = [];
  for (const [idx, title, desc, status, priority, category, createdDays, updatedDays] of ticketData) {
    const createdAt = daysAgo(createdDays);
    const updatedAt = daysAgo(updatedDays, 14);
    const result = await pool.query(
      `INSERT INTO tickets (customer_id, title, description, status, priority, category, assigned_to, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [customerIds[idx], title, desc, status, priority, category, SUPPORT_TEAM[ticketIds.length % SUPPORT_TEAM.length], createdAt, updatedAt]
    );
    ticketIds.push(result.rows[0].id);
    ticketTimestamps.push(updatedAt);
  }

  const commentTemplates: [string, boolean][] = [
    ['Thank you for reporting this. We are investigating the issue and will update you shortly.', false],
    ['Root cause appears to be a caching layer misconfiguration. Escalating to engineering.', true],
    ['We have identified the issue and deployed a fix. Please verify on your end.', false],
    ['Customer is on Enterprise plan. Prioritize response within 2 hours.', true],
    ['Could you provide the exact error message and timestamp when this occurred?', false],
    ['Similar issue reported by CloudBridge last week. Check linked ticket for resolution notes.', true],
    ['We have scheduled a call for tomorrow at 10:00 CET to walk through the setup.', false],
    ['Customer health score dropped. Flag for CS team review.', true],
    ['The configuration change has been applied. Please test and confirm.', false],
    ['Waiting on engineering patch ETA. Expected by end of week.', true],
    ['Your account has been updated. The billing discrepancy should be resolved within 24 hours.', false],
    ['High churn risk. Recommend proactive outreach from Customer Success.', true],
    ['We have added this to our product roadmap for Q3 consideration.', false],
    ['SSO metadata file had incorrect entity ID. Fixed and resent to customer.', true],
    ['Training materials have been shared via email. Let us know if you need additional sessions.', false],
  ];

  let commentCount = 0;
  for (let i = 0; i < ticketIds.length && commentCount < 55; i++) {
    const numComments = 1 + (i % 3);
    for (let j = 0; j < numComments && commentCount < 55; j++) {
      const template = commentTemplates[commentCount % commentTemplates.length];
      const commentTime = hoursAfter(ticketTimestamps[i], -(j + 1) * 5);
      await pool.query(
        `INSERT INTO ticket_comments (ticket_id, author, message, is_internal, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [ticketIds[i], SUPPORT_TEAM[commentCount % SUPPORT_TEAM.length], template[0], template[1], commentTime]
      );
      commentCount++;
    }
  }

  const onboardingCustomers = [6, 3, 8, 11, 7, 5];
  const onboardingCompletedCount: Record<number, number> = {
    6: 4,
    3: 2,
    8: 4,
    11: 3,
    7: 7,
    5: 7,
  };

  const taskTemplates: [string, string, boolean][] = [
    ['Account created', 'Customer account provisioned and welcome email sent', true],
    ['Intro call completed', 'Kickoff call with stakeholders completed', false],
    ['Technical setup completed', 'Core integrations and SSO configured', false],
    ['First login completed', 'Primary admin completed first login', false],
    ['Team invited', 'All team members invited to workspace', false],
    ['Customer trained', 'Training session completed for key users', false],
    ['Go live completed', 'Production launch confirmed and monitored', false],
  ];

  const completeOnboardingCustomers = [7, 5];

  for (const custIdx of onboardingCustomers) {
    const completedTarget = onboardingCompletedCount[custIdx] ?? 0;
    const forceAllComplete = completeOnboardingCustomers.includes(custIdx);

    for (let t = 0; t < taskTemplates.length; t++) {
      const [title, description] = taskTemplates[t];
      const shouldComplete = forceAllComplete || t < completedTarget;
      const dueOffset = ONBOARDING_TASK_DUE_OFFSETS[title] ?? 7;

      await pool.query(
        `INSERT INTO onboarding_tasks (customer_id, title, description, completed, due_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [customerIds[custIdx], title, description, shouldComplete, daysFromNow(dueOffset), daysAgo(30 - t * 2)]
      );
    }

    if (forceAllComplete) {
      await pool.query(
        `UPDATE onboarding_tasks SET completed = true WHERE customer_id = $1`,
        [customerIds[custIdx]]
      );
    }
  }

  const notes: [number, string, string, number][] = [
    [2, 'Customer expressed frustration at last QBR. Schedule follow up with CS lead.', 'Emma Nilsson', 8],
    [2, 'Three escalations in past month. Monitor closely.', 'Adel Laghmari', 15],
    [9, 'Renewal at risk. Competitor evaluation in progress.', 'Emma Nilsson', 6],
    [3, 'Onboarding going well. Technical contact very responsive.', 'Sara Lindqvist', 4],
    [4, 'Key enterprise account. White glove support approved.', 'Adel Laghmari', 22],
    [7, 'New onboarding. Assign dedicated CS for first 30 days.', 'Emma Nilsson', 11],
    [0, 'Expansion opportunity: interested in adding 50 seats.', 'James Chen', 3],
    [8, 'Excellent health score. Good candidate for case study.', 'Emma Nilsson', 18],
  ];

  for (const [idx, note, author, days] of notes) {
    await pool.query(
      'INSERT INTO customer_notes (customer_id, note, created_by, created_at) VALUES ($1, $2, $3, $4)',
      [customerIds[idx], note, author, daysAgo(days)]
    );
  }

  const articles: [string, string, string, string, number, number][] = [
    ['How to troubleshoot login issues', 'Troubleshooting',
     'When customers cannot log in after password reset or SSO changes:\n\n1. Verify account status is active in Admin > Users\n2. Check if SSO provider mapping is correct\n3. Confirm MFA device is registered\n4. Review recent password policy changes\n5. Test login in incognito to rule out cache issues\n6. Escalate to engineering if multiple users are affected',
     'Use this guide when a customer cannot access the dashboard after password reset or SSO changes.',
     120, 14],
    ['How to reset API tokens', 'Account Setup',
     'API token reset procedure:\n\n1. Navigate to Settings > API Keys\n2. Identify the affected token (production vs sandbox)\n3. Revoke the compromised or expired token\n4. Generate a new token with minimum required scopes\n5. Share securely with customer technical contact\n6. Confirm integration is working within 15 minutes\n\nRemind customers: never store tokens in client-side code.',
     'Use when a customer reports expired or compromised API tokens.',
     95, 8],
    ['How to handle billing plan mismatch', 'Billing',
     'Billing discrepancy workflow:\n\n1. Compare Stripe/subscription record with in-app plan tier\n2. Check for recent upgrade/downgrade requests\n3. Verify proration was applied correctly\n4. Document findings in customer notes\n5. Apply correction or issue credit if confirmed\n6. Send confirmation email to billing contact\n\nSLA: resolve within 24 hours for Enterprise accounts.',
     'Use when invoice amount does not match the plan shown in the product.',
     80, 5],
    ['Onboarding checklist for new customers', 'Onboarding',
     'Standard 14 day onboarding timeline:\n\nDay 1 to 2: Account setup, intro call, stakeholder mapping\nDay 3 to 5: Technical configuration, SSO, integrations\nDay 6 to 8: Team invitations, role assignments\nDay 9 to 11: Training sessions for admins and end users\nDay 12 to 14: Go live review, monitoring, handoff to CS\n\nEnterprise accounts: assign dedicated CSM for first 30 days.',
     'Use during new customer onboarding to keep tasks on track.',
     150, 20],
    ['Webhook integration troubleshooting guide', 'Integrations',
     'Common webhook failures and fixes:\n\n1. Endpoint must use HTTPS with valid SSL certificate\n2. Increase timeout to 30 seconds for large payloads\n3. Verify signing secret matches on both sides\n4. Check payload size limit (max 1MB)\n5. Review retry logs for 4xx vs 5xx responses\n6. Test with sample payload from Settings > Integrations',
     'Use when outbound webhooks fail or stop delivering events.',
     65, 3],
    ['Resolving dashboard access issues', 'Troubleshooting',
     '403 errors on dashboard access:\n\n1. Verify user role permissions in Admin > Users\n2. Check organization SSO mapping\n3. Clear browser cache and retry\n4. Review auth middleware logs for session expiry\n5. Confirm user belongs to correct workspace\n6. Escalate if affecting multiple users post-deployment',
     'Use when users report 403 or permission errors on the main dashboard.',
     110, 12],
    ['Handling urgent priority tickets', 'Troubleshooting',
     'Urgent ticket SLA: first response within 1 hour, resolution target 4 hours.\n\n1. Acknowledge immediately with customer facing comment\n2. Assess business impact and affected users\n3. Escalate to on call engineer if production is down\n4. Provide hourly updates until resolved\n5. Add internal notes for handoff between shifts\n6. Post incident: document root cause and prevention',
     'Use as a checklist when an urgent ticket is assigned to you.',
     200, 45],
    ['Customer health score guide', 'Onboarding',
     'Health score factors:\n• Open ticket count and priority level\n• Onboarding completion percentage\n• Customer status (active, at_risk, onboarding)\n• Recent unresolved issues\n\nScore ranges:\n70+ Healthy (green): proactive check in optional\n40 to 69 Needs attention (yellow): schedule follow up\nBelow 40 At risk (red): immediate CS outreach required',
     'Use to understand why a customer health score changed.',
     90, 30],
    ['Customer onboarding handover checklist', 'Onboarding',
     'Before handing off a customer from onboarding to support:\n\n1. Confirm all onboarding tasks are complete\n2. Verify primary admin and billing contact are set\n3. Document integrations and custom configurations\n4. Add internal notes about key stakeholders\n5. Schedule 30 day check in with Customer Success\n6. Send welcome email with support contact details',
     'Use when onboarding is complete and the account moves to active support.',
     45, 7],
    ['How to document internal support notes', 'Account Setup',
     'Best practices for internal notes:\n\n1. Write clearly for the next agent on shift\n2. Include what was tried and what is pending\n3. Note customer sentiment and business impact\n4. Link related tickets when relevant\n5. Avoid sensitive data unless necessary\n6. Update notes after every significant action',
     'Use to keep internal context clear across the support team.',
     75, 10],
    ['How to handle customers at risk', 'Onboarding',
     'When a customer is flagged at risk:\n\n1. Review open tickets and recent escalations\n2. Check health score factors and onboarding status\n3. Schedule a proactive call within 48 hours\n4. Involve Customer Success for Enterprise accounts\n5. Document retention risk in customer notes\n6. Set a follow up date and owner',
     'Use when health score drops below 40 or status is at_risk.',
     55, 4],
  ];

  for (const [title, category, content, usageNote, createdDays, updatedDays] of articles) {
    const supportNote = `Link this guide in the ticket internal note when you use it. ${usageNote}`;
    await pool.query(
      `INSERT INTO knowledge_articles (title, category, content, usage_note, support_note, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [title, category, content, usageNote, supportNote, daysAgo(createdDays), daysAgo(updatedDays)]
    );
  }
}
