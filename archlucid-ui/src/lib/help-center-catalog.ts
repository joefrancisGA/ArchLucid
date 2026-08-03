import { resolveProductDocumentationContentKind } from "@/lib/product-documentation-content-kinds";
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
  "how-it-works",
  "evidence-intake",
  "review-packages",
  "review-guide",
  "findings",
  "evidence-trail",
  "governance-approval",
  "executive-summary",
  "cloud-connections",
  "security-trust",
  "data-handling",
  "users-and-roles",
  "billing-and-plans",
  "troubleshooting",
] as const;

const HELP_CENTER_TIER_BY_SLUG: Readonly<Record<string, HelpCenterTier>> = {
  "getting-started": "product",
  "evidence-intake": "product",
  "review-packages": "product",
  findings: "product",
  "evidence-trail": "product",
  "evidence-only-review": "product",
  "governance-approval": "product",
  "executive-summary": "product",
  "audit-trail": "product",
  "how-it-works": "product",
  "data-handling": "product",
  "data-handling-tenant-isolation": "product",
  "dpa-template": "product",
  subprocessors: "product",
  "cloud-connections": "product",
  "cloud-connections-azure": "product",
  "cloud-connections-aws": "product",
  "cloud-connections-gcp": "product",
  "azure-permissions": "product",
  "security-trust": "product",
  "authentication-sign-in": "product",
  "report-a-problem": "product",
  "users-and-roles": "product",
  "billing-and-plans": "product",
  troubleshooting: "product",
  glossary: "product",
  scope: "product",
  "pilot-guide": "product",
  "path-chooser": "product",
  "enterprise-onboarding": "admin",
  "integration-readiness": "admin",
  procurement: "admin",
  "product-overview": "product",
  "configuration-reference": "internal",
  alerts: "admin",
  "specialty-walkthroughs": "admin",
  "first-hour-operator-path": "product",
  "review-guide": "product",
  "first-pilot-path": "product",
  "first-architecture-review": "product",
  "first-review": "internal",
  "first-value-20-minutes": "internal",
  "cli-usage": "internal",
  "developer-troubleshooting": "internal",
  "accelerator-chooser": "internal",
  "governance-api-contracts": "internal",
  "admin-diagnostics": "internal",
  "evaluator-workbook": "internal",
  "pilot-feedback": "internal",
  "comparison-replay": "internal",
  "repeat-review-loop": "internal",
  "policy-pack-delta-demo": "internal",
  "pilot-roi-model": "product",
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
  "first-architecture-review": {
    title: "Your first architecture review",
    summary:
      "Your guided path from evidence intake to a finalized architecture review and sponsor-ready exports.",
  },
  "dpa-template": {
    title: "Data Processing Agreement (template)",
    summary:
      "Negotiation template for counsel — request the diligence pack from Trust Center; not your countersigned DPA.",
  },
  subprocessors: {
    title: "Subprocessors",
    summary: "Hosted ArchLucid subprocessors register — use with the DPA template and Trust Center pack.",
  },
  "pilot-guide": {
    title: "Pilot guide",
    summary:
      "Prepare for a pilot, run the first review, interpret outputs, report issues, and get help.",
  },
  "first-pilot-path": {
    title: "Complete review workflow",
    summary:
      "Create a review, attach evidence, review findings, finalize, and export sponsor-ready artifacts.",
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

function isProductHelpEntry(entry: ProductDocumentationEntry): boolean {
  return resolveProductDocumentationContentKind(entry.slug) === "product-help";
}

function isTechnicalDocumentationEntry(entry: ProductDocumentationEntry): boolean {
  return resolveProductDocumentationContentKind(entry.slug) === "technical-documentation";
}

/** Product-help topics for the Guides tab — featured by default; admin/internal when expanded and permitted. */
export function listHelpCenterGuideTopics(filters: HelpCenterTopicFilters): ProductDocumentationEntry[] {
  return listHelpCenterTopics(filters).filter(isProductHelpEntry);
}

/** Non-featured guide topics revealed when advanced is expanded. */
export function listHelpCenterAdvancedGuideTopics(filters: HelpCenterTopicFilters): ProductDocumentationEntry[] {
  return listHelpCenterAdvancedTopics(filters).filter(isProductHelpEntry);
}

/** Technical-documentation topics for the Documentation tab; internal tier requires admin. */
export function listHelpCenterDocumentationTopics(filters: Pick<HelpCenterTopicFilters, "isAdmin">): ProductDocumentationEntry[] {
  return listProductDocumentationEntries().filter((entry) => {
    if (!isTechnicalDocumentationEntry(entry)) {
      return false;
    }

    const tier = getHelpCenterTier(entry);

    if (tier === "internal") {
      return filters.isAdmin;
    }

    return true;
  });
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
