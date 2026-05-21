/** Homepage marketing copy — aligned to service-led GTM (pain → outcome → report). */

export const WELCOME_HERO_PITCH =
  "Turn scattered architecture evidence into an evidence-backed review your ARB can trust — prioritized findings, explicit limits where we do not conclude, and an exportable report in days instead of weeks. ArchLucid runs a governed workflow from capture through report so every claim traces to proof, not a chat transcript that disappears.";

export const WELCOME_HERO_CTA_SUBHEADING =
  "See an architecture review package built for governance — not slide decks alone.";

export const WELCOME_PROBLEM_HEADING = "Architecture review is broken when diagrams are the only artifact";

export const WELCOME_PROBLEM_BODY =
  "Manual reviews are slow, inconsistent, and hard to defend under audit. Ad-hoc AI tools produce fluent prose without evidence links, policy context, or a durable record. Teams still ship decisions on opinions buried in email and Confluence — not a review package stakeholders can replay.";

export const WELCOME_SOLUTION_HEADING = "The outcome is a defensible review package";

export const WELCOME_SOLUTION_BODY =
  "ArchLucid delivers a prioritized, evidence-linked architecture review: structured findings, recorded decisions, stated limits, and exports your ARB and security partners can follow. Same hosted workflow whether you start a trial, open the self-demo, or engage us for a service-led review.";

export type WelcomeWorkflowStep = {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
};

/** Canonical operator marketing vocabulary (GTM / demo script alignment). */
export const WELCOME_WORKFLOW_STEPS: readonly WelcomeWorkflowStep[] = [
  {
    id: "capture",
    label: "Capture",
    summary: "Ingest architecture requests, topology, and supporting artifacts — including bulk evidence upload.",
  },
  {
    id: "evidence",
    label: "Evidence",
    summary: "Build an evidence graph that ties sources to what the pipeline examined.",
  },
  {
    id: "review",
    label: "Review",
    summary: "Run governed multi-agent analysis with quality gates — not a one-shot chat.",
  },
  {
    id: "findings",
    label: "Findings",
    summary: "Surface prioritized issues with severity, category, and traceable claims.",
  },
  {
    id: "decisions",
    label: "Decisions",
    summary: "Record approvals, overrides, and rationale on the decision trail.",
  },
  {
    id: "report",
    label: "Report",
    summary: "Export DOCX/PDF and whitelabeled packages for ARB, audit, and procurement.",
  },
] as const;

export const WELCOME_WORKFLOW_INTRO =
  "Every service-led engagement and self-demo walkthrough follows the same six-stage vocabulary — so buyers, operators, and governance partners share one mental model.";

export type WelcomeUseCaseCard = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
};

export const WELCOME_USE_CASE_CARDS: readonly WelcomeUseCaseCard[] = [
  {
    id: "ai-governance-security",
    title: "AI governance + security baseline",
    body: "Default bundled policy packs seed responsible-AI and security-architecture rules on every new tenant — ready for regulated and cloud-native reviews without building packs from scratch.",
  },
  {
    id: "azure-waf",
    title: "Azure Well-Architected Framework",
    body: "Curated WAF-themed compliance rules accelerate cloud posture reviews against reliability, security, cost, and operations pillars — mapped to architecture evidence, not checkbox theater.",
  },
  {
    id: "azure-caf-lz",
    title: "Azure CAF / landing zone",
    body: "Landing-zone and Cloud Adoption Framework themes help teams sanity-check platform design, identity, and network patterns before ARB — especially for Azure-first estates.",
  },
] as const;

/** Thematic-mapping disclaimer — must stay aligned with docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md §2. */
export const WELCOME_POLICY_PACK_DISCLAIMER =
  "Bundled policy packs use informative thematic mapping to accelerate architecture review. They do not constitute statutory legal classification, conformity assessment, CIS/OWASP/PCI/HIPAA/SOC 2 pass-fail automation, or Microsoft Well-Architected / CAF / landing-zone certification. Buyers remain responsible for jurisdictional applicability, contractual obligations, auditor evidence breadth, and any certification claims.";
