import { DEMO_USER } from '../constants/demoUser';

const RECRUITER_HIGHLIGHTS = [
  'Fullstack app with React, Node.js, Express and PostgreSQL',
  'REST API with Zod validation',
  'Customer health scoring from support signals',
  'Ticket workflow with internal and customer comments',
  'Onboarding progress with overdue task alerts',
  'Search, filtering and sorting across operational data',
  'Knowledge base for internal support docs',
];

const FEATURES = [
  'Customer health scoring',
  'Recommended next actions',
  'Internal vs customer comments',
  'Onboarding progress tracking',
  'Search, filter and sorting',
  'Knowledge base documentation',
  'Dashboard analytics',
  'REST API with Zod validation',
];

const DEMO_FLOW = [
  'Start on Dashboard for priorities, health scores and workload.',
  'Open Customers and click View on an account.',
  'Open Tickets and click a title to review communication.',
  'Open Onboarding to check progress and overdue tasks.',
  'Open Knowledge Base for internal support guides.',
];

const FUTURE = [
  'User authentication and role based access',
  'Email notifications for ticket updates',
  'Real time updates via WebSockets',
  'SLA tracking and breach alerts',
  'Customer self service portal',
];

export function Settings() {
  return (
    <div className="about-page">
      <div className="page-header about-hero">
        <h1>About This Demo</h1>
        <p>SaaS Support Desk. Built by {DEMO_USER.name}.</p>
      </div>

      <div className="card review-guide-card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-title">Recommended Demo Flow</div>
        <p className="section-text">
          A quick path through the app. About 5 minutes.
        </p>
        <ol className="review-guide-list">
          {DEMO_FLOW.map((step, i) => (
            <li key={step}>{i + 1}. {step}</li>
          ))}
        </ol>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-title">Why This Project Exists</div>
        <p className="section-text">
          Support teams need more than a ticket list. They need customer context, onboarding status,
          health signals, and a clear view of what to do next. This app models that workflow in a
          fullstack support desk.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-title">What Problem It Solves</div>
        <p className="section-text">
          Growing SaaS companies juggle accounts, tickets, onboarding and retention risk across
          different tools. SaaS Support Desk brings those workflows into one place so support and
          customer success can see account health, act on priorities, and keep communication structured.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-title">Focus Areas</div>
        <div className="highlight-grid">
          <div className="highlight-card">
            <h4>Tech</h4>
            <p>React, TypeScript, Node.js, Express, PostgreSQL, REST API, validation, search and data modeling</p>
          </div>
          <div className="highlight-card">
            <h4>Communication</h4>
            <p>Ticket comments, internal notes, support history, knowledge base and recommended next actions</p>
          </div>
          <div className="highlight-card">
            <h4>Customer Success</h4>
            <p>Health scoring, at risk accounts, onboarding progress, prioritization and follow up workflows</p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Recruiter Highlights</div>
          <ul className="section-list">
            {RECRUITER_HIGHLIGHTS.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="card">
          <div className="card-title">Tech Stack</div>
          <ul className="section-list">
            <li>Frontend: React + TypeScript + Vite</li>
            <li>Backend: Node.js + Express + TypeScript</li>
            <li>Database: PostgreSQL (in memory fallback for local demo)</li>
            <li>API: REST with Zod validation</li>
            <li>Deploy: Vercel (frontend), Render or Railway (backend)</li>
            <li>DB hosting: Neon or Supabase</li>
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <div className="card-title">Key Features</div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f} className="feature-chip">{f}</div>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.25rem' }}>
        <div className="card">
          <div className="card-title">Demo Data</div>
          <ul className="section-list">
            <li>12 SaaS customers with realistic profiles</li>
            <li>30 support tickets across categories</li>
            <li>55+ comments (customer facing and internal)</li>
            <li>Onboarding checklists for 6 customers</li>
            <li>11 knowledge base articles</li>
            <li>Dynamic health score calculation</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-title">Future Improvements</div>
          <ul className="section-list">
            {FUTURE.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <div className="card-title">Logged in as</div>
        <p className="section-text">
          <strong>{DEMO_USER.name}</strong>, {DEMO_USER.role}
          <br />
          <span className="muted-text">
            Demo mode. No login required.
          </span>
        </p>
      </div>
    </div>
  );
}
