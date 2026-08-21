import { formatPublicWorkSchoolProviderClaim } from "@/lib/marketing/public-auth-provider-claims";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/**
 * Buyer-safe FAQ copy for /faq and FAQPage JSON-LD (TB-254). No internal or roadmap-heavy language.
 * Sign-in provider claims are resolved at read time so Google is not advertised unless configured.
 */

export type MarketingFaqCategoryId =
  | "product-basics"
  | "evaluation-first-review"
  | "sign-in-access"
  | "evidence-cloud"
  | "pricing-ai"
  | "governance-audit"
  | "security-trust";

export type MarketingFaqCategory = {
  readonly id: MarketingFaqCategoryId;
  readonly title: string;
  readonly intro: string;
};

/** Default-open accordion items for the “Most asked” band on `/faq`. */
export const MARKETING_FAQ_MOST_ASKED_ITEM_IDS = [
  "first-review-outcomes",
  "pricing-plans",
  "security-assurance-materials",
] as const satisfies ReadonlyArray<string>;

export type MarketingFaqRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export type MarketingFaqItem = {
  readonly id: string;
  readonly categoryId: MarketingFaqCategoryId;
  readonly question: string;
  readonly answer: string;
  readonly relatedLinks?: ReadonlyArray<MarketingFaqRelatedLink>;
};

export const MARKETING_FAQ_CATEGORIES: ReadonlyArray<MarketingFaqCategory> = [
  {
    id: "product-basics",
    title: "Product basics",
    intro: "What ArchLucid is, who it serves, and how it differs from general-purpose AI assistants.",
  },
  {
    id: "evaluation-first-review",
    title: "Evaluation and first review",
    intro: "Paths to your first review, demo workspaces, and what is included in an evaluation.",
  },
  {
    id: "sign-in-access",
    title: "Sign-in and access",
    intro: "Work or school sign-in, email codes, and when SSO enforcement applies.",
  },
  {
    id: "evidence-cloud",
    title: "Evidence and cloud access",
    intro: "Evidence-only reviews, supported clouds, and upload limits.",
  },
  {
    id: "pricing-ai",
    title: "Pricing and AI usage",
    intro: "Plans, AI usage allowances, and how budgeting works in trial workspaces.",
  },
  {
    id: "governance-audit",
    title: "Governance and audit",
    intro: "Sponsor outputs, finalized review records, and approval workflows.",
  },
  {
    id: "security-trust",
    title: "Security & assurance",
    intro: "Data protection, assurance materials, and procurement diligence entry points.",
  },
] as const;

export function buildHowDoISignInFaqAnswer(): string {
  return `Use a work or school account (${formatPublicWorkSchoolProviderClaim()}, or your organization's SSO when configured) or request a one-time code sent to any email address. ArchLucid does not use product passwords for routine sign-in.`;
}

/** Ordered for buyer comprehension and monetization — do not sort alphabetically. */
const MARKETING_FAQ_ITEM_TEMPLATES: ReadonlyArray<MarketingFaqItem> = [
  {
    id: "what-is-archlucid",
    categoryId: "product-basics",
    question: "What is ArchLucid?",
    answer:
      "ArchLucid turns scattered architecture evidence into a prioritized, evidence-linked architecture review — structured findings, traceability, and exportable outputs for enterprise architects and sponsors.",
    relatedLinks: [
      { label: "Get started", href: "/get-started" },
      { label: "View pricing", href: "/pricing" },
    ],
  },
  {
    id: "who-is-archlucid-for",
    categoryId: "product-basics",
    question: "Who is ArchLucid for?",
    answer:
      "Principal architects, enterprise architects, cloud architects, architecture review board members, and technical sponsors who need defensible, evidence-linked reviews rather than slide-only opinions.",
  },
  {
    id: "vs-chatgpt-copilot",
    categoryId: "product-basics",
    question: "How is ArchLucid different from ChatGPT, Copilot, Claude, or Gemini?",
    answer:
      "Frontier AI assistants can draft advice, but they do not commit a finalized review record, typed audit ledger, optional pre-commit approval check, or traversable evidence chain for your workspace. ArchLucid is built for repeatable, sponsor-exportable architecture proof.",
    relatedLinks: [{ label: "Why ArchLucid", href: "/why" }],
  },
  {
    id: "first-review-outcomes",
    categoryId: "evaluation-first-review",
    question: "What do I get after my first architecture review?",
    answer:
      "A review with prioritized findings, evidence links, governance-ready outputs, and exportable artifacts you can share with sponsors, review boards, or procurement — without rebuilding the narrative in slides.",
    relatedLinks: [
      { label: "Get started", href: "/get-started" },
      { label: "See it in 30 seconds", href: "/see-it" },
    ],
  },
  {
    id: "one-architect-license",
    categoryId: "evaluation-first-review",
    question: "Can I start with one architect or one license?",
    answer:
      "Yes. ArchLucid supports an individual Architect evaluation path for one user and one workspace, with included AI usage limits. Teams can expand later.",
  },
  {
    id: "evaluation-workspace",
    categoryId: "evaluation-first-review",
    question: "How does the evaluation workspace work?",
    answer:
      "Start an evaluation workspace from the signup page, then sign in with a work or school account or a one-time email code. You can inspect sample findings, evidence trails, governance outputs, and reports before running your own review.",
    relatedLinks: [
      { label: "Start evaluation", href: "/signup" },
      { label: "Getting started help", href: inAppHelpHref("getting-started") },
    ],
  },
  {
    id: "how-do-i-sign-in",
    categoryId: "sign-in-access",
    question: "How do I sign in to ArchLucid?",
    // Replaced by buildHowDoISignInFaqAnswer() in getMarketingFaqItems().
    answer: "",
  },
  {
    id: "enterprise-sso-enforcement",
    categoryId: "sign-in-access",
    question: "When does my organization require SSO?",
    answer:
      "Organizations can configure SAML or OpenID Connect and require members of verified domains to use the organization's identity provider. When enforcement applies to your email domain, routine email-code sign-in is not available.",
  },
  {
    id: "cloud-access-optional",
    categoryId: "evidence-cloud",
    question: "Do I need cloud access to get value?",
    answer:
      "No. You can complete a review using uploaded evidence such as briefs, diagrams, documents, IaC exports, and screenshots. Azure, AWS, and GCP connectors are optional and can be added later for read-only evidence collection.",
    relatedLinks: [{ label: "Get started", href: "/get-started" }],
  },
  {
    id: "cloud-platforms",
    categoryId: "evidence-cloud",
    question: "Which cloud platforms does ArchLucid support?",
    answer:
      "ArchLucid supports evidence workflows for Azure, AWS, GCP, multi-cloud, and evidence-only reviews. Cloud connectors are optional and should be configured only for platforms relevant to the workspace.",
  },
  {
    id: "evidence-upload-types",
    categoryId: "evidence-cloud",
    question: "What evidence can I upload?",
    answer:
      "Architecture briefs, diagrams, Word or PDF documents, Terraform or Bicep exports, cloud inventory ZIPs, screenshots, and scope notes. You can start evidence-only and add connectors later.",
  },
  {
    id: "how-many-files-upload",
    categoryId: "evidence-cloud",
    question: "How many files can I upload?",
    answer:
      "Bulk evidence upload accepts up to 30 files per batch in the review workspace. For larger corpora, split batches or use your integration path per workspace policy.",
  },
  {
    id: "customer-data-protection",
    categoryId: "security-trust",
    question: "How does ArchLucid protect customer data?",
    answer:
      "Tenant isolation, scoped access, encryption in transit, and audit logging are core to the platform. See Security & assurance and the Trust Center for current control summaries and diligence materials.",
    relatedLinks: [
      { label: "Assurance status", href: "/assurance-status" },
      { label: "Trust Center", href: "/trust" },
    ],
  },
  {
    id: "demo-workspaces",
    categoryId: "evaluation-first-review",
    question: "Are demo workspaces real customer data?",
    answer:
      "Demo workspaces use sample architecture data so evaluators can inspect findings, evidence trails, governance outputs, and reports without uploading customer data.",
    relatedLinks: [{ label: "Sample showcase", href: CANONICAL_ANONYMOUS_PROOF_HREF }],
  },
  {
    id: "pricing-plans",
    categoryId: "pricing-ai",
    question: "How does pricing work?",
    answer:
      "ArchLucid is packaged for individual architects, teams, professional review practices, and enterprise deployments. Plans include a defined AI usage allowance, with larger evaluations supported through prepaid credits or approved customer AI providers. Enterprise options can include SSO, directory sync, and advanced governance — specifics depend on your plan and diligence process.",
    relatedLinks: [
      { label: "View pricing", href: "/pricing" },
      { label: "Procurement FAQ", href: inAppHelpHref("procurement") },
    ],
  },
  {
    id: "ai-usage-allowance",
    categoryId: "pricing-ai",
    question: "How does AI usage or AI budget work?",
    answer:
      "Each plan includes a monthly AI usage allowance for review generation, specialist analysis, and export preparation. ArchLucid surfaces budget status in the workspace and may throttle or pause expensive actions when an allowance is exhausted. Demo and trial workspaces use lower caps to prevent surprise usage; teams can add prepaid credits or connect an approved customer AI provider on enterprise plans.",
    relatedLinks: [
      { label: "View pricing", href: "/pricing" },
      { label: "AI usage help", href: inAppHelpHref("ai-usage") },
    ],
  },
  {
    id: "sponsor-sponsor-value",
    categoryId: "governance-audit",
    question: "What does the sponsor get?",
    answer:
      "A sponsor report, value narrative, and exportable proof packet that tie findings and decisions to evidence — so sponsors can approve, fund, or remediate with traceability instead of anecdote.",
    relatedLinks: [
      { label: "Sponsor report help", href: inAppHelpHref("sponsor-report") },
      { label: "View pricing", href: "/pricing" },
    ],
  },
  {
    id: "governance-and-audit",
    categoryId: "governance-audit",
    question: "How does ArchLucid support governance and audit?",
    answer:
      "Reviews can pass through approval workflows, produce finalized review records, and maintain an audit trail linking findings, evidence, and decisions. Exports support diligence and architecture review board accountability.",
  },
  {
    id: "security-assurance-materials",
    categoryId: "security-trust",
    question: "What security assurance materials are available?",
    answer:
      "Security & assurance and the Trust Center describe current controls, data handling, and assurance posture. For procurement diligence (SOC 2 posture, penetration testing, subprocessors), open the procurement FAQ. Formal third-party attestations, where applicable, should be handled through the security review process.",
    relatedLinks: [
      { label: "Assurance status", href: "/assurance-status" },
      { label: "Trust Center", href: "/trust" },
      { label: "Procurement FAQ", href: inAppHelpHref("procurement") },
    ],
  },
  {
    id: "evaluation-not-included",
    categoryId: "evaluation-first-review",
    question: "What is not included in the first evaluation?",
    answer:
      "The first evaluation focuses on product comprehension and a sample or first review workflow — not a full enterprise deployment, custom integrations, or production connector configuration unless you choose to add them.",
  },
  {
    id: "request-help-guided-trial",
    categoryId: "evaluation-first-review",
    question: "How do I request help or a guided trial?",
    answer:
      "Start an evaluation workspace from the signup page, request a guided trial from pricing, or contact sales for a walkthrough tailored to your architecture review process.",
    relatedLinks: [
      { label: "View pricing", href: "/pricing" },
      { label: "Get started", href: "/get-started" },
    ],
  },
] as const;

/** Resolve FAQ answers at call time (env-gated IdP claims). */
export function getMarketingFaqItems(): ReadonlyArray<MarketingFaqItem> {
  return MARKETING_FAQ_ITEM_TEMPLATES.map((item) => {
    if (item.id === "how-do-i-sign-in") {
      return { ...item, answer: buildHowDoISignInFaqAnswer() };
    }

    return item;
  });
}

/**
 * Snapshot for callers that still import a constant. Prefer {@link getMarketingFaqItems}
 * in React render paths so Google claims track `NEXT_PUBLIC_GOOGLE_OIDC_*`.
 */
export const MARKETING_FAQ_ITEMS: ReadonlyArray<MarketingFaqItem> = getMarketingFaqItems();

/** Returns the promoted "Most asked" items in curated promotion order. */
export function selectMarketingFaqMostAskedItems(
  items: ReadonlyArray<MarketingFaqItem> | null | undefined,
): MarketingFaqItem[] {
  if (items === null || items === undefined) {
    return [];
  }

  return MARKETING_FAQ_MOST_ASKED_ITEM_IDS.map((itemId) => items.find((item) => item.id === itemId)).filter(
    (item): item is MarketingFaqItem => item !== undefined,
  );
}

/**
 * Returns items for the category sections, excluding promoted "Most asked" items.
 * Each panel id doubles as a `/faq#<id>` deep-link target, so rendering a question in
 * both places would emit duplicate DOM ids and make the anchor ambiguous.
 */
export function selectMarketingFaqCategoryItems(
  items: ReadonlyArray<MarketingFaqItem> | null | undefined,
): MarketingFaqItem[] {
  if (items === null || items === undefined) {
    return [];
  }

  const promotedIds = new Set<string>(MARKETING_FAQ_MOST_ASKED_ITEM_IDS);

  return items.filter((item) => !promotedIds.has(item.id));
}

export function marketingFaqItemsByCategory(
  items: ReadonlyArray<MarketingFaqItem>,
): ReadonlyArray<{ readonly category: MarketingFaqCategory; readonly items: readonly MarketingFaqItem[] }> {
  return MARKETING_FAQ_CATEGORIES.map((category) => ({
    category,
    items: items.filter((item) => item.categoryId === category.id),
  })).filter((group) => group.items.length > 0);
}
