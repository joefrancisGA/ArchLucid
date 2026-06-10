import { getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";

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
  "/audit",
  "/graph",
  "/manifests",
  "/reviews",
  "/executive",
  "/snapshot",
  "/ask",
  "/compare",
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
      "Every review produces downloadable manifests, audit trails, and export bundles you can take offline.",
    proofHref: getShowcaseManifestHref(),
    proofLabel: "Signed manifest",
    proofQueryParam: "focus=export",
  },
  {
    id: "integration",
    question: "Can it integrate with our tools?",
    answer:
      "V1 exposes a documented REST API and CLI; Jira, Teams, and webhooks are on the V1.1 roadmap.",
    proofHref: "/audit?runId=claims-intake-modernization",
    proofLabel: "Audit trail",
    proofQueryParam: "focus=api",
  },
];
