import {
  listProductDocumentationEntries,
  type ProductDocumentationEntry,
} from "@/lib/product-documentation-registry";

/** Customer help center layering — product, admin/integration, internal/engineering. */
export type HelpCenterTier = "product" | "admin" | "internal";

export type HelpCenterDisplay = {
  title: string;
  summary: string;
};

/** Default landing grid — 8–12 intent-based topics (not the full registry). */
export const HELP_CENTER_FEATURED_SLUGS: readonly string[] = [
  "getting-started",
  "evidence-intake",
  "review-packages",
  "findings",
  "evidence-trail",
  "governance-approval",
  "executive-summary",
  "cloud-connections",
  "security-trust",
  "operator-auth-roles",
  "billing-and-plans",
  "troubleshooting",
] as const;

const HELP_CENTER_TIER_BY_SLUG: Readonly<Record<string, HelpCenterTier>> = {
  "getting-started": "product",
  "evidence-intake": "product",
  "review-packages": "product",
  findings: "product",
  "evidence-trail": "product",
  "governance-approval": "product",
  "executive-summary": "product",
  "audit-trail": "product",
  "how-it-works": "product",
  "cloud-connections": "product",
  "cloud-connections-azure": "product",
  "security-trust": "product",
  "workload-identity-federation": "product",
  "azure-permissions": "product",
  "users-and-roles": "product",
  "billing-and-plans": "product",
  troubleshooting: "product",
  "pilot-guide": "product",
  "path-chooser": "product",
  glossary: "product",
  "enterprise-onboarding": "admin",
  procurement: "admin",
  "configuration-reference": "admin",
  "operator-auth-roles": "admin",
  alerts: "admin",
  "specialty-walkthroughs": "admin",
  "first-hour-operator-path": "product",
  "review-guide": "product",
  "first-pilot-path": "internal",
  "core-pilot": "product",
  "first-value-20-minutes": "internal",
  "cli-usage": "internal",
  "developer-troubleshooting": "internal",
  "accelerator-chooser": "internal",
  "operator-shell": "internal",
  "projection-cache-replicas": "internal",
  "governance-api-contracts": "internal",
  "admin-diagnostics": "internal",
  "evaluator-workbook": "internal",
  "pilot-feedback": "internal",
  "comparison-replay": "internal",
  observability: "internal",
  "knowledge-graph": "internal",
  "repeat-review-loop": "internal",
  "pilot-roi-model": "internal",
};

const HELP_CENTER_DISPLAY_OVERRIDES: Readonly<Partial<Record<string, HelpCenterDisplay>>> = {
  "users-and-roles": {
    title: "Users and roles",
    summary: "Assign Admin, Architect, Reader, and Auditor roles; map IdP groups to ArchLucid authority.",
  },
  "enterprise-onboarding": {
    title: "Hosted SaaS enterprise onboarding checklist",
    summary:
      "Configure an enterprise tenant — SSO, roles, governance, policy packs, audit export, and optional cloud connector evidence.",
  },
  "core-pilot": {
    title: "Your first architecture review",
    summary:
      "First-session checklist — evidence-only or cloud connectors (Azure, AWS, GCP), finalize, and sponsor exports.",
  },
  "pilot-guide": {
    title: "Pilot guide",
    summary:
      "Prepare for a pilot, run the first review, interpret outputs, report issues, and get help.",
  },
};

export function getHelpCenterTier(entry: ProductDocumentationEntry): HelpCenterTier {
  const mapped = HELP_CENTER_TIER_BY_SLUG[entry.slug];

  if (mapped !== undefined) {
    return mapped;
  }

  if (entry.audience === "developer") {
    return "internal";
  }

  return "product";
}

export function getHelpCenterDisplay(entry: ProductDocumentationEntry): HelpCenterDisplay {
  const override = HELP_CENTER_DISPLAY_OVERRIDES[entry.slug];

  if (override !== undefined) {
    return override;
  }

  return { title: entry.title, summary: entry.summary };
}

export type HelpCenterTopicFilters = {
  showAdvanced: boolean;
  isAdmin: boolean;
};

function isFeaturedSlug(slug: string): boolean {
  return HELP_CENTER_FEATURED_SLUGS.includes(slug);
}

/** Topics for the Help landing grid — featured by default; admin/internal when expanded and permitted. */
export function listHelpCenterTopics(filters: HelpCenterTopicFilters): ProductDocumentationEntry[] {
  const entries = listProductDocumentationEntries();

  return entries.filter((entry) => {
    const tier = getHelpCenterTier(entry);

    if (isFeaturedSlug(entry.slug)) {
      return true;
    }

    if (!filters.showAdvanced) {
      return false;
    }

    if (tier === "internal") {
      return filters.isAdmin;
    }

    return tier === "admin" || tier === "product";
  });
}

/** Non-featured topics revealed when advanced is expanded (for section headings). */
export function listHelpCenterAdvancedTopics(filters: HelpCenterTopicFilters): ProductDocumentationEntry[] {
  return listHelpCenterTopics(filters).filter((entry) => !isFeaturedSlug(entry.slug));
}

export function filterHelpCenterTopicsByQuery(
  topics: readonly ProductDocumentationEntry[],
  query: string,
): ProductDocumentationEntry[] {
  const q = query.trim().toLowerCase();

  if (q.length === 0) {
    return [...topics];
  }

  return topics.filter((entry) => {
    const display = getHelpCenterDisplay(entry);
    const haystack = `${display.title} ${display.summary} ${entry.slug}`.toLowerCase();

    return haystack.includes(q);
  });
}
