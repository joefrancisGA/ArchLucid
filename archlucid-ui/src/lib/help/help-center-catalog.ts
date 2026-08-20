import {
  CAIQ_SIG_RESPONSE_HELP_CENTER_SUMMARY,
  CAIQ_SIG_RESPONSE_HELP_PAGE_TITLE,
} from "@/lib/caiq-sig-response-help-guide-content";
import { ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE } from "@/lib/enterprise-onboarding-help-copy";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";
import { ACCELERATOR_CHOOSER_HELP_PAGE_TITLE } from "@/lib/accelerator-chooser-help-page-copy";
import { ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE } from "@/lib/admin-diagnostics-help-page-copy";
import { REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE } from "@/lib/repeat-review-loop-help-guide-content";
import { isInternalRunbookSlug } from "@/lib/product-documentation-content-kinds";
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
  "first-architecture-review",
  "evidence-intake",
  "review-packages",
  "findings",
  "evidence-trail",
  "governance-approval",
  "sponsor-report",
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
  "governance-approval": "product",
  "policy-packs": "product",
  "sponsor-report": "product",
  "audit-trail": "product",
  "data-handling": "product",
  "dpa-template": "product",
  "soc2-self-assessment": "product",
  "caiq-sig-response": "product",
  subprocessors: "product",
  "cloud-connections": "product",
  "cloud-connections-azure": "product",
  "cloud-connections-aws": "product",
  "cloud-connections-gcp": "product",
  "azure-permissions": "product",
  "security-trust": "product",
  "authentication-sign-in": "product",
  "report-a-problem": "product",
  "contact-support": "product",
  "users-and-roles": "product",
  "billing-and-plans": "product",
  troubleshooting: "product",
  glossary: "product",
  scope: "product",
  "pilot-guide": "product",
  "choose-your-next-step": "product",
  "enterprise-onboarding": "admin",
  "integration-readiness": "product",
  procurement: "product",
  "configuration-reference": "internal",
  alerts: "admin",
  "specialty-walkthroughs": "admin",
  "review-guide": "product",
  "first-architecture-review": "product",
  "cli-usage": "internal",
  "engineering-troubleshooting": "internal",
  "accelerator-chooser": "product",
  "api-contracts": "internal",
  "admin-diagnostics": "product",
  "pilot-feedback": "internal",
  "comparison-replay": "product",
  "repeat-review-loop": "product",
};

const HELP_CENTER_DISPLAY_OVERRIDES: Readonly<Partial<Record<string, HelpCenterDisplay>>> = {
  "users-and-roles": {
    title: "Users and roles",
    summary: "Assign Admin, Architect, Reader, and Auditor roles; map IdP groups to ArchLucid authority.",
  },
  "enterprise-onboarding": {
    title: ENTERPRISE_ONBOARDING_HELP_PAGE_TITLE,
    summary:
      "Configure an enterprise tenant — SSO, roles, governance, policy packs, audit export, and optional cloud connector evidence.",
  },
  "first-architecture-review": {
    title: FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE,
    summary:
      "Your guided path from evidence intake to a finalized architecture review and export-ready outputs.",
  },
  "repeat-review-loop": {
    title: REPEAT_REVIEW_LOOP_HELP_PAGE_TITLE,
    summary:
      "After your first finalized review: compare packages, replay authority, and collect second-review proof.",
  },
  "accelerator-chooser": {
    title: ACCELERATOR_CHOOSER_HELP_PAGE_TITLE,
    summary:
      "Map buyer jobs to starter proof packs after your first finalized architecture review — inputs, outputs, and when not to use each pack.",
  },
  "admin-diagnostics": {
    title: ADMIN_DIAGNOSTICS_HELP_PAGE_TITLE,
    summary:
      "System health, workspace readiness, assistant diagnostics, and observability signals for platform health.",
  },
  "dpa-template": {
    title: "Data Processing Agreement (template)",
    summary:
      "Negotiation template for counsel — request the diligence pack from Trust Center; not your countersigned DPA.",
  },
  "soc2-self-assessment": {
    title: "SOC 2 self-assessment",
    summary:
      "Owner TSC readiness mapping — not a CPA Type I/II attestation; open Trust Center for the diligence pack.",
  },
  "caiq-sig-response": {
    title: CAIQ_SIG_RESPONSE_HELP_PAGE_TITLE,
    summary: CAIQ_SIG_RESPONSE_HELP_CENTER_SUMMARY,
  },
  "api-contracts": {
    title: "API contracts (technical reference)",
    summary:
      "Admin/developer HTTP and OpenAPI contract reference — not buyer governance-approval help.",
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
  /** ArchLucid internal operator shell — required to list host configuration catalogs. */
  isInternalOperator?: boolean;
};

function isFeaturedSlug(slug: string): boolean {
  return HELP_CENTER_FEATURED_SLUGS.includes(slug);
}

/**
 * Guides list carries product help plus the remaining technical-documentation topics.
 * Internal engineering runbooks stay out entirely; tier gating (`getHelpCenterTier`) still applies on top.
 */
function isHelpCenterGuideEntry(entry: ProductDocumentationEntry): boolean {
  return !isInternalRunbookSlug(entry.slug);
}

/** Topics for the Guides list — featured by default; admin/internal when expanded and permitted. */
export function listHelpCenterGuideTopics(filters: HelpCenterTopicFilters): ProductDocumentationEntry[] {
  return listHelpCenterTopics(filters).filter(isHelpCenterGuideEntry);
}

/** Non-featured guide topics revealed when advanced is expanded. */
export function listHelpCenterAdvancedGuideTopics(filters: HelpCenterTopicFilters): ProductDocumentationEntry[] {
  return listHelpCenterAdvancedTopics(filters).filter(isHelpCenterGuideEntry);
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

    if (entry.slug === "configuration-reference") {
      return filters.isAdmin && filters.isInternalOperator === true;
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
