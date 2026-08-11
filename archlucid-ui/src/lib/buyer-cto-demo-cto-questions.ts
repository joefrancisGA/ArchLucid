import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

export type CtoDemoQuestion = {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly proofHref: string;
  readonly proofLabel: string;
  readonly proofQueryParam?: string;
  readonly proofFragment?: string;
};

/** Route prefixes reachable in demo mode — update when adding cheat-panel proof links. */
export const CTO_DEMO_KNOWN_VALID_ROUTE_PREFIXES: readonly string[] = [
  "/trust",
  "/pricing",
  "/see-it",
  "/governance",
  "/governance/audit",
  "/insights/evidence-graph",
  "/manifests",
  "/governance/signed-records",
  "/architecture/reviews",
  "/executive",
  "/snapshot",
  "/insights/ask-review-questions",
  "/insights/compare-two-reviews",
  "/get-started",
  "/help",
  "/compliance-journey",
];

/** Anticipated CTO diligence questions with one-line answers and proof deep links. */
export const CTO_DEMO_QUESTIONS: readonly CtoDemoQuestion[] = [
  {
    id: "security",
    question: "Is our data secure?",
    answer:
      "Each tenant gets an isolated database catalog — your architecture data never shares a persistence boundary with other customers.",
    proofHref: "/trust",
    proofLabel: "Trust center",
    proofQueryParam: "focus=isolation",
  },
  {
    id: "residency",
    question: "Where does our data go?",
    answer:
      "Deploy in your Azure region; extraction uses Tier 1 ZIP uploads so ArchLucid never needs vendor credentials in your cloud.",
    proofHref: "/trust",
    proofLabel: "Data handling",
    proofQueryParam: "focus=data-handling",
  },
  {
    id: "accuracy",
    question: "How accurate is the AI?",
    answer:
      "Findings link to evidence sources in the provenance graph — simulator and live modes are labeled so you know what was verified.",
    proofHref: "/see-it",
    proofLabel: "Sample output",
  },
  {
    id: "cost",
    question: "What does it cost?",
    answer:
      "Pilot pricing is sales-led with transparent tiering; token usage is visible per run for FinOps review.",
    proofHref: "/pricing",
    proofLabel: "Pricing",
  },
  {
    id: "lock-in",
    question: "Will we be locked in?",
    answer:
      "Every review produces downloadable review records, audit trails, and export bundles you can take offline.",
    proofHref: getShowcaseManifestHref(),
    proofLabel: SIGNED_MANIFEST_LABEL,
    proofQueryParam: "focus=export",
  },
  {
    id: "integration",
    question: "Can it integrate with our tools?",
    answer:
      "ArchLucid exposes a documented REST API and CLI; Jira, Teams, and webhooks are on the future-release roadmap.",
    proofHref: auditTrailNavHref("claims-intake-modernization"),
    proofLabel: "Audit trail",
    proofQueryParam: "focus=api",
  },
  {
    id: "data-retention",
    question: "How do you handle data retention and deletion?",
    answer:
      "Tenant data is stored in your isolated catalog; export bundles and offboarding deletion are documented for procurement and GDPR-style DSAR workflows.",
    proofHref: "/trust",
    proofLabel: "Data retention",
    proofQueryParam: "focus=data-retention",
  },
  {
    id: "model-training",
    question: "Is our data used to train models?",
    answer:
      "Inference uses your Azure OpenAI deployment under your data-processing terms; ArchLucid does not use customer architecture briefs to train foundation models.",
    proofHref: "/trust",
    proofLabel: "Model usage",
    proofQueryParam: "focus=data-handling",
  },
  {
    id: "sso",
    question: "Does it support SSO and SCIM?",
    answer:
      "Enterprise tenants integrate with Entra ID, Okta, and SAML/OIDC providers; group-to-role mapping is configured per workspace.",
    proofHref: "/trust",
    proofLabel: "Identity integration",
    proofQueryParam: "focus=identity",
  },
  {
    id: "rbac",
    question: "How granular is access control?",
    answer:
      "Role-based access separates review, approve, and administer authorities; workspace scope limits which reviews a principal can see or mutate.",
    proofHref: "/governance/approval-queue",
    proofLabel: "Governance roles",
    proofQueryParam: "focus=rbac",
  },
  {
    id: "sla",
    question: "What uptime and support do you commit to?",
    answer:
      "Pilot and production tiers publish target availability and support response windows in the customer agreement; health status is visible in the architect workspace.",
    proofHref: "/trust",
    proofLabel: "Service commitments",
    proofQueryParam: "focus=sla",
  },
  {
    id: "incident-response",
    question: "What happens if there is a security incident?",
    answer:
      "Documented incident notification paths, severity tiers, and customer communication timelines are summarized in the trust center for security reviewers.",
    proofHref: "/trust",
    proofLabel: "Incident response",
    proofQueryParam: "focus=incident-response",
  },
];
