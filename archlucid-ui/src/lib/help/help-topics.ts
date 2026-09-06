import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { tryResolveInAppDocHref } from "@/lib/in-app-doc-href";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";

/**
 * Static contextual help index for the architect workspace. Doc paths are relative to the repository root.
 */
export type HelpTopic = {
  id: string;
  title: string;
  keywords: string[];
  summary: string;
  /**
   * Relative path under repo root (for copy/paste; web URL via getDocHref).
   * Empty when the topic is app-rendered only — prefer `routes` that start with `/help`.
   */
  docPath: string;
  /** App routes where this topic is most relevant (pathname prefix or exact). */
  routes: string[];
};

/** Topics for the Help drawer “Troubleshooting” tab (ops / auth / support). */
export const TROUBLESHOOTING_HELP_TOPIC_IDS = new Set<string>([
  "contact-support",
  "troubleshooting",
  "auth",
  "cli",
  "support-bundle",
]);

/**
 * Guides tab default ordering — buyer golden path first (new review → reviews → evidence trail → Ask → governance).
 */
export const GOLDEN_PATH_GUIDE_TOPIC_IDS: readonly string[] = [
  "first-run",
  "pilot-guide",
  "artifacts",
  "graph",
  "ask-archlucid",
  "governance-workflow",
  "compare",
  "replay",
  "alerts",
  "policy-packs",
  "system-health",
  "admin-configuration",
  "pilot-feedback",
  "scope",
];

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "first-review",
    title: "First-run evidence checklist (internal runbook)",
    keywords: ["checklist", "first run", "pilot", "extractor", "audit", "roi", "admin"],
    summary:
      "Admin-only SE/ops printable checklist — extractor ZIP, finalize, ROI proof, and audit export. Buyers should use Your first architecture review instead.",
    docPath: "docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md",
    routes: ["/", "/architecture/first-review-guide", "/architecture/reviews/new", SPONSOR_DASHBOARD_HREF],
  },
  {
    id: "pilot-guide",
    title: "Pilot guide",
    keywords: ["sidebar", "nav", "analysis", "governance", "unlock", "first review", "pilot"],
    summary:
      "Prepare for a pilot and understand how the sidebar stays focused on the first-review path until finalize, then unlocks analysis and approval on demand.",
    docPath: "docs/library/customer-facing/PILOT_GUIDE.md",
    routes: ["/", "/architecture/reviews", "/architecture/first-review-guide"],
  },
  {
    id: "first-run",
    title: "Create your first review",
    keywords: ["wizard", "create", "pipeline", "review", "request"],
    summary:
      "Create a request, track progress, finalize the review record, and review artifacts, findings, and the review trail.",
    docPath: "docs/library/FIRST_RUN_WIZARD.md",
    routes: ["/architecture/reviews/new", "/", "/architecture/first-review-guide"],
  },
  {
    id: "artifacts",
    title: "Reviewing artifacts",
    keywords: ["download", "review", "bundle", "zip"],
    summary: "Open a review, then review artifact list, previews, and bundle downloads from review detail.",
    docPath: "docs/library/operator-shell.md",
    routes: ["/architecture/reviews"],
  },
  {
    id: "compare",
    title: "Compare two reviews",
    keywords: ["diff", "delta", "replay"],
    summary: "Use Compare to diff two reviews' findings, decisions, and persisted comparison records.",
    docPath: "docs/library/COMPARISON_REPLAY.md",
    routes: ["/insights/compare-two-reviews"],
  },
  {
    id: "replay",
    title: "Validate review",
    keywords: ["verify", "drift", "validation"],
    summary: "Validate whether a finalized review can still be reproduced and its finalized review record remains valid.",
    docPath: "docs/library/COMPARISON_REPLAY.md",
    routes: ["/internal/validate-route"],
  },
  {
    id: "graph",
    title: "Review trail graph",
    keywords: ["provenance", "knowledge graph"],
    summary:
      "Visual review trail for one architecture review — evidence map and provenance tied to the selected review context.",
    docPath: "docs/library/KNOWLEDGE_GRAPH.md",
    routes: ["/insights/evidence-graph"],
  },
  {
    id: "ask-archlucid",
    title: "Ask about a review",
    keywords: ["chat", "question", "sponsor", "assistant"],
    summary:
      "Attach the sample architecture review (or your workspace review), ask export-ready questions, and follow threaded answers.",
    docPath: "docs/library/operator-shell.md",
    routes: ["/insights/ask-review-questions"],
  },
  {
    id: "governance-workflow",
    title: "Approval",
    keywords: ["approval", "promote", "staging", "production"],
    summary:
      "Submit → review → approve → promote: walk approvals for a finalized review when your workspace enables approval workflows.",
    docPath: "docs/library/customer-facing/GOVERNANCE_APPROVAL_OPERATOR_GUIDE.md",
    routes: ["/governance/approval-queue"],
  },
  {
    id: "alerts",
    title: "Alerts",
    keywords: ["inbox", "ack", "noise"],
    summary:
      "Learn how alerts are created, triaged in the inbox, and configured through alert rules.",
    docPath: "docs/library/customer-facing/ALERTS_OPERATOR_GUIDE.md",
    routes: ["/alerts", "/alert-rules", "/governance/alerts", "/governance/alert-rules"],
  },
  {
    id: "digests",
    title: "Architecture digests",
    keywords: ["digest", "schedule", "subscription", "summary", "sponsor digest"],
    summary:
      "Schedule digest summaries of review activity, configure recipients, and browse generated digests.",
    docPath: "",
    routes: ["/architecture/digests", "/digests", "/help/digests"],
  },
  {
    id: "policy-packs",
    title: "Policy packs",
    keywords: ["governance", "compliance", "pack", "conflicts", "precedence"],
    summary: "Policy packs bundle rules and defaults; assign scope and inspect merged policy rules.",
    docPath: "docs/library/customer-facing/POLICY_PACKS_OPERATOR_GUIDE.md",
    routes: ["/governance/policy-packs", "/governance/standards-and-rules"],
  },
  {
    id: "system-health",
    title: "System health dashboard",
    keywords: ["ready", "health", "circuit", "diagnostics", "metrics"],
    summary: "In-app readiness checks, circuit breaker gates, and onboarding funnel counters — same signals as CLI doctor without leaving the workspace.",
    docPath: "docs/library/customer-facing/OPERATOR_ADMIN_DIAGNOSTICS.md",
    routes: ["/administration/system-health", "/internal/health"],
  },
  {
    id: "admin-configuration",
    title: "Configuration summary",
    keywords: ["appsettings", "environment", "catalog", "admin", "secrets"],
    summary:
      "Read-only Effective configuration snapshot: catalog sections, declared sources, set flags, and masked values for sensitive keys.",
    docPath: "docs/library/CONFIGURATION_REFERENCE.md",
    routes: ["/internal/configuration"],
  },
  {
    id: "contact-support",
    title: "Contact support",
    keywords: ["support", "contact", "email", "help", "ticket"],
    summary: "Email support, report a problem, download a diagnostics bundle, and open troubleshooting guides.",
    docPath: "docs/library/customer-facing/CONTACT_SUPPORT.md",
    routes: ["/help/contact-support"],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    keywords: ["error", "503", "401", "health", "proxy"],
    summary: "Use health endpoints, CLI doctor, and support bundle for triage.",
    docPath: "",
    routes: ["/help/troubleshooting"],
  },
  {
    id: "auth",
    title: "Authentication",
    keywords: ["sign in", "sso", "email code", "invitation", "recovery", "passwordless"],
    summary: "Passwordless sign-in with work or school accounts or email one-time codes; SSO enforcement and recovery.",
    docPath: "docs/library/customer-facing/AUTHENTICATION_AND_SIGN_IN.md",
    routes: ["/auth/signin", "/signup"],
  },
  {
    id: "cli",
    title: "CLI",
    keywords: ["archlucid", "dotnet run", "terminal"],
    summary: "CLI commands call the HTTP API; use doctor and support-bundle for diagnostics.",
    docPath: "docs/library/CLI_USAGE.md",
    routes: [],
  },
  {
    id: "support-bundle",
    title: "Support bundle",
    keywords: ["zip", "triage", "ticket", "download"],
    summary: "Download a redacted support bundle from Help or Settings (POST /v1/admin/support-bundle), or use the CLI support-bundle command.",
    docPath: "docs/runbooks/TROUBLESHOOTING.md",
    routes: [],
  },
  {
    id: "glossary",
    title: "Glossary",
    keywords: ["terms", "definitions", "finding", "risk", "review", "evidence trail"],
    summary: "Customer-facing definitions for review, evidence, approval, and organization terms.",
    docPath: "",
    routes: ["/help/glossary"],
  },
  {
    id: "users-and-roles",
    title: "Users and roles",
    keywords: ["roles", "permissions", "admin", "reader", "auditor", "invite"],
    summary: "Workspace roles, access management, and reviewer invitations.",
    docPath: "docs/library/customer-facing/USERS_AND_ROLES_GUIDE.md",
    routes: ["/help/users-and-roles"],
  },
  {
    id: "scope",
    title: "Tenant / workspace / project scope",
    keywords: ["headers", "x-tenant-id", "isolation"],
    summary: "Scope headers isolate data; keep the same scope between UI and API integrations.",
    docPath: "docs/library/customer-facing/WORKSPACE_SCOPE_GUIDE.md",
    routes: ["/help/scope"],
  },
  {
    id: "pilot-feedback",
    title: "Pilot feedback",
    keywords: ["58r", "triage", "learning"],
    summary: "Pilot feedback captures human judgments separately from recommendation learning.",
    docPath: "docs/library/PRODUCT_LEARNING.md",
    routes: ["/internal/product-learning"],
  },
];

/**
 * In-app help route for a repo-relative docs path (`/help/{topic}` or `/help` fallback).
 */
export function getDocHref(docPath: string): string | null {
  const relative = docPath?.trim() ?? "";

  if (relative.length === 0) {
    return null;
  }

  return tryResolveInAppDocHref(relative);
}

/**
 * Prefer an explicit `/help…` route on the topic; otherwise resolve `docPath` to an in-app help href.
 */
export function getHelpTopicHref(topic: HelpTopic): string | null {
  const helpRoute = topic.routes.find((route) => {
    const trimmed = route.trim();

    return trimmed === "/help" || trimmed.startsWith("/help/");
  });

  if (helpRoute !== undefined) {
    return helpRoute.trim();
  }

  return getDocHref(topic.docPath);
}

/** Host configuration catalog — internal operator Help drawer only, not tenant Admin. */
const HOST_CONFIGURATION_HELP_TOPIC_IDS = new Set<string>(["admin-configuration"]);

function helpTopicsVisibleInCurrentShell(): HelpTopic[] {
  if (isArchLucidInternalOperatorShellEnv()) {
    return HELP_TOPICS;
  }

  return HELP_TOPICS.filter((topic) => !HOST_CONFIGURATION_HELP_TOPIC_IDS.has(topic.id));
}

export function helpTopicsForGuidesTab(): HelpTopic[] {
  const filtered = helpTopicsVisibleInCurrentShell().filter((t) => !TROUBLESHOOTING_HELP_TOPIC_IDS.has(t.id));

  function rank(id: string): number {
    const i = GOLDEN_PATH_GUIDE_TOPIC_IDS.indexOf(id);

    if (i >= 0) {
      return i;
    }

    return 900 + filtered.findIndex((t) => t.id === id);
  }

  return [...filtered].sort((a, b) => rank(a.id) - rank(b.id));
}

export function helpTopicsForTroubleshootingTab(): HelpTopic[] {
  return helpTopicsVisibleInCurrentShell().filter((t) => TROUBLESHOOTING_HELP_TOPIC_IDS.has(t.id));
}

export function filterHelpTopics(query: string, pathname: string): HelpTopic[] {
  const q = query.trim().toLowerCase();
  const visibleTopics = helpTopicsVisibleInCurrentShell();

  if (q.length === 0) {
    const byRoute = visibleTopics.filter((topic) =>
      topic.routes.some((route) => pathname === route || pathname.startsWith(`${route}/`)),
    );

    return byRoute.length > 0
      ? byRoute
      : [...helpTopicsForGuidesTab(), ...visibleTopics.filter((t) => TROUBLESHOOTING_HELP_TOPIC_IDS.has(t.id))];
  }

  const scored = visibleTopics.map((topic) => {
    let score = 0;

    for (const route of topic.routes) {
      if (pathname === route || pathname.startsWith(`${route}/`)) {
        score += 3;
      }
    }

    if (topic.title.toLowerCase().includes(q)) {
      score += 5;
    }

    if (topic.summary.toLowerCase().includes(q)) {
      score += 2;
    }

    for (const kw of topic.keywords) {
      if (kw.includes(q) || q.includes(kw)) {
        score += 2;
      }
    }

    return { topic, score };
  });

  const matched = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score);

  if (matched.length > 0) {
    return matched.map((x) => x.topic);
  }

  return visibleTopics.filter(
    (topic) =>
      topic.title.toLowerCase().includes(q) ||
      topic.summary.toLowerCase().includes(q) ||
      topic.keywords.some((k) => k.includes(q)),
  );
}
