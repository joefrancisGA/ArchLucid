import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import {
  ARCHITECTURES_LIST_PATH,
  ARCHITECTURES_NEW_PATH,
  REVIEWS_LIST_PATH,
} from "@/lib/architecture/architecture-routes";
import { buildGoldenSponsorPackageWalkthroughHref, GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA, GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_TITLE } from "@/lib/golden-sponsor-package-walkthrough";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { WORKING_REVIEWS_INBOX_NAV_LABEL } from "@/lib/operator/operator-nav-labels";

import { localizeHelpCopy } from "@/lib/help/help-product-copy";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
} from "@/lib/governance/governance-route-paths";
import { GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export const GETTING_STARTED_HELP_SUBTITLE =
  "Learn how ArchLucid turns architecture evidence into review findings, decisions, and approval-ready outputs.";

export const GETTING_STARTED_HELP_PAGE_SUBTITLE_OPERATOR = GETTING_STARTED_HELP_SUBTITLE;

export const GETTING_STARTED_HELP_PAGE_SUBTITLE_BUYER =
  "See how evidence becomes findings, decisions, and approval outputs before your first review.";

export const GETTING_STARTED_HELP_BREADCRUMB_TOPIC_TITLE = "Getting started" as const;

export const SECURENOW_GETTING_STARTED_HELP_SUBTITLE =
  "Learn how SecureNow connects cloud inventory evidence, evaluates ARC-AMPE policy packs, and supports findings triage and remediation workflows.";

export const SECURENOW_GETTING_STARTED_HELP_PAGE_SUBTITLE_BUYER =
  "See how cloud evidence becomes ARC-AMPE findings, remediation work, and audit lineage before your first connector or pack assignment.";

export function gettingStartedHelpPageSubtitle(
  buyerPolishedShell: boolean,
  productLineId: ProductLineId = "architecture",
): string {
  if (isSecureNowProductLine(productLineId)) {
    return buyerPolishedShell
      ? SECURENOW_GETTING_STARTED_HELP_PAGE_SUBTITLE_BUYER
      : SECURENOW_GETTING_STARTED_HELP_SUBTITLE;
  }

  const subtitle = buyerPolishedShell
    ? GETTING_STARTED_HELP_PAGE_SUBTITLE_BUYER
    : GETTING_STARTED_HELP_PAGE_SUBTITLE_OPERATOR;

  return localizeHelpCopy(productLineId, subtitle);
}

export const GETTING_STARTED_HELP_AUDIENCE_LINE =
  "For architects, pilot teams, and sponsors who want to understand the review flow before starting.";

export const GETTING_STARTED_HELP_CLAIM_DISCIPLINE =
  "This guide orients you through the review flow — it is not a sealed-review diligence Sources package. Open Security & Trust or a finalized review before treating onboarding copy as procurement evidence.";

export const GETTING_STARTED_HELP_SOURCES_INTRO =
  "Use these follow-ups when getting-started orientation turns into a first review, path choice, or assurance questions.";

export type GettingStartedHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Diligence Sources — no self-href to /help/getting-started. Retired how-it-works topic bookmarks
 * permanently redirect to #how-archlucid-works below, so it is intentionally omitted here to avoid a self-link.
 */
export const GETTING_STARTED_HELP_SOURCES: readonly GettingStartedHelpSourceLink[] = [
  { label: "Start a review", href: "/architecture/reviews/new" },
  { label: "Choose your next step", href: inAppHelpHref("choose-your-next-step") },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Security & Trust", href: "/assurance-status" },
] as const;

export const GETTING_STARTED_HELP_PATH = "/help/getting-started" as const;

/** Retired operator bookmark — no App Router page; help lives at GETTING_STARTED_HELP_PATH. */
export const LEGACY_GETTING_STARTED_PATH = "/getting-started" as const;

export const GETTING_STARTED_HELP_TOPIC_LABEL = "How to get started" as const;

export const GETTING_STARTED_HELP_QUICK_START_TITLE = "Start with your first review";

export const GETTING_STARTED_HELP_QUICK_START_COPY =
  "Upload evidence, run the review, inspect findings, finalize the review, and share the outputs.";

export const GETTING_STARTED_HELP_DIAGRAM_TITLE = "How ArchLucid works";

export const GETTING_STARTED_HELP_DIAGRAM_SUMMARY =
  "ArchLucid ingests architecture evidence, evaluates it against your standards, and produces a formal architecture review you can share.";

export const GETTING_STARTED_HELP_DIAGRAM_STEPS = [
  "Evidence",
  "Analyze",
  "Findings",
  "Decisions",
  "Approval outputs",
] as const;

export const GETTING_STARTED_HELP_PIPELINE_TEXT_STAGES = [
  "Architecture request opens a review session and feeds context ingestion.",
  "Authority pipeline stages: knowledge graph, findings, decisioning, and artifacts.",
  "Approval gate: allow commits the sealed review record; block or warn policy holds finalize.",
  "Committed outputs: sealed review record and downloadable exports.",
] as const;

export const GETTING_STARTED_HELP_PIPELINE_DIAGRAM_DESCRIPTION =
  "Stages from architecture request through context ingestion, authority pipeline (knowledge graph, findings, decisioning, artifacts), approval gate (allow commits the sealed review record; block or warn policy holds finalize), and committed outputs (sealed review record and exports).";

export const GETTING_STARTED_HELP_PIPELINE_WORKING_TEXT_STAGES = [
  "Architecture request opens a review session and feeds context ingestion.",
  "Review analysis stages: evidence intake, findings, decisions, and export-ready outputs.",
  "Approval gate: allow commits the sealed review record; block or warn policy holds finalize.",
  "Committed outputs: sealed review record and downloadable exports.",
] as const;

export const GETTING_STARTED_HELP_PIPELINE_WORKING_DIAGRAM_DESCRIPTION =
  "Stages from architecture request through context ingestion, review analysis (evidence intake, findings, decisions, outputs), approval gate, and committed outputs (sealed review record and exports).";

export const GETTING_STARTED_HELP_PIPELINE_WORKING_INTRO =
  "Review flow from architecture request through approval check and committed outputs:";

export function resolveGettingStartedHelpPipelineTextStages(workingMode: boolean): readonly string[] {
  return workingMode ? GETTING_STARTED_HELP_PIPELINE_WORKING_TEXT_STAGES : GETTING_STARTED_HELP_PIPELINE_TEXT_STAGES;
}

export function resolveGettingStartedHelpPipelineDiagramDescription(workingMode: boolean): string {
  return workingMode
    ? GETTING_STARTED_HELP_PIPELINE_WORKING_DIAGRAM_DESCRIPTION
    : GETTING_STARTED_HELP_PIPELINE_DIAGRAM_DESCRIPTION;
}

export function resolveGettingStartedHelpPipelineIntro(workingMode: boolean): string {
  return workingMode ? GETTING_STARTED_HELP_PIPELINE_WORKING_INTRO : "Authority pipeline from architecture request through approval check and committed outputs:";
}

export function resolveGettingStartedHelpPipelineDiagramAccessibleName(workingMode: boolean): string {
  return workingMode ? "Architecture review progress" : "Architecture review authority pipeline";
}

export type GettingStartedPlainLanguageTerm = {
  readonly term: string;
  readonly definition: string;
};

export const GETTING_STARTED_HELP_PLAIN_LANGUAGE_TERMS: readonly GettingStartedPlainLanguageTerm[] = [
  {
    term: "Architecture package",
    definition:
      "The durable record of findings, decisions, evidence, and exports for one architecture review.",
  },
  {
    term: "Evidence",
    definition:
      "Briefs, diagrams, documents, IaC exports, and optional cloud inventory that describe the architecture under review.",
  },
  {
    term: "Findings",
    definition:
      "Structured issues and risks surfaced during analysis, each tied to evidence and severity.",
  },
  {
    term: "Decision",
    definition:
      "A recorded disposition on review proposal — uch as approve, waive, defer, or escalat — aptured for approval and audit.",
  },
  {
    term: "Sealed review record",
    definition:
      "The immutable package locked when a review is finalized — the authoritative anchor for approvals, exports, and evidence lineage.",
  },
  {
    term: "Evidence trail",
    definition:
      "A traceable path from each finding back to the artifacts and context that supported it.",
  },
  {
    term: "Policy pack",
    definition:
      "Versioned policy standards and rules applied to reviews for your workspace or project.",
  },
  {
    term: "Approval",
    definition:
      "Formal sign-off workflow when a review requires approver acknowledgement before release.",
  },
];

export type GettingStartedWorkflowStep = {
  readonly stepNumber: number;
  readonly title: string;
  readonly description: string;
  readonly expectedOutputs: string;
  readonly href: string;
  readonly ctaLabel: string;
};

export const GETTING_STARTED_HELP_WORKFLOW_STEPS: readonly GettingStartedWorkflowStep[] = [
  {
    stepNumber: 1,
    title: "Add architecture evidence",
    description: "Start a review and attach briefs, diagrams, documents, IaC, or optional cloud inventory.",
    expectedOutputs: "Evidence linked to the review.",
    href: "/architecture/reviews/new",
    ctaLabel: BUYER_START_ARCHITECTURE_REVIEW_CTA,
  },
  {
    stepNumber: 2,
    title: "Analyze the architecture",
    description: "Start the review and monitor progress until findings are ready to inspect.",
    expectedOutputs: "Findings with severity, impact, and evidence labels.",
    href: "/architecture/reviews",
    ctaLabel: "Open reviews",
  },
  {
    stepNumber: 3,
    title: "Review findings",
    description: "Triage issues, confirm evidence coverage, and note items that need approval follow-up.",
    expectedOutputs: "Prioritized findings ready for decisions.",
    href: "/governance/findings",
    ctaLabel: "Open findings queue",
  },
  {
    stepNumber: 4,
    title: "Record decisions",
    description: "Capture approvals, accepted risks, and remediation owners before finalizing.",
    expectedOutputs: "Architecture decisions and approval notes.",
    href: "/governance/approval-queue",
    ctaLabel: "Open approval workflow",
  },
  {
    stepNumber: 5,
    title: "Finalize and share outputs",
    description: "Lock the review and export sponsor-ready artifacts for stakeholders.",
    expectedOutputs: "Sealed review record, evidence trail, and exports.",
    href: "/architecture/reviews",
    ctaLabel: "Open reviews",
  },
];

/** SY-87 — Working help examples use architecture nested URLs; inbox stays labeled Inbox. */
export function resolveGettingStartedHelpWorkflowSteps(
  workingMode: boolean,
): readonly GettingStartedWorkflowStep[] {
  if (!workingMode) {
    return GETTING_STARTED_HELP_WORKFLOW_STEPS;
  }

  return [
    {
      stepNumber: 1,
      title: "Add architecture evidence",
      description: "Open your architecture desk and attach briefs, diagrams, documents, IaC, or optional cloud inventory.",
      expectedOutputs: "Evidence linked to the architecture review.",
      href: ARCHITECTURES_NEW_PATH,
      ctaLabel: "New review",
    },
    {
      stepNumber: 2,
      title: "Analyze the architecture",
      description: "Start the review from the architecture desk and monitor progress until findings are ready to inspect.",
      expectedOutputs: "Findings with severity, impact, and evidence labels.",
      href: ARCHITECTURES_LIST_PATH,
      ctaLabel: "Open architecture desk",
    },
    {
      stepNumber: 3,
      title: "Review findings",
      description: "Triage issues, confirm evidence coverage, and note items that need approval follow-up.",
      expectedOutputs: "Prioritized findings ready for decisions.",
      href: ARCHITECTURES_LIST_PATH,
      ctaLabel: "Open findings",
    },
    {
      stepNumber: 4,
      title: "Record decisions",
      description: "Capture approvals, accepted risks, and remediation owners before finalizing.",
      expectedOutputs: "Architecture decisions and approval notes.",
      href: "/governance/approval-queue",
      ctaLabel: "Open approval workflow",
    },
    {
      stepNumber: 5,
      title: "Finalize and share outputs",
      description: "Lock the review from the nested review desk and export sponsor-ready artifacts for stakeholders.",
      expectedOutputs: "Sealed review record, evidence trail, and exports.",
      href: REVIEWS_LIST_PATH,
      ctaLabel: WORKING_REVIEWS_INBOX_NAV_LABEL,
    },
  ];
}

export type GettingStartedActionCard = {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly ctaLabel: string;
};

const sampleReviewHref = buildGoldenSponsorPackageWalkthroughHref();

export const GETTING_STARTED_HELP_WORKING_QUICK_START_TITLE = "Use ArchLucid as your review desk" as const;

export const GETTING_STARTED_HELP_WORKING_QUICK_START_COPY =
  "Resume a draft, open an architecture package, inspect sealed records, or start a new review from the draft editor." as const;

export function resolveGettingStartedHelpPrimaryActions(workingMode: boolean): readonly GettingStartedActionCard[] {
  if (!workingMode) {
    return [
      {
        title: "Start review",
        description: GETTING_STARTED_HELP_QUICK_START_COPY,
        href: GETTING_STARTED_HELP_PRIMARY_ACTIONS.startReview.href,
        ctaLabel: GETTING_STARTED_HELP_PRIMARY_ACTIONS.startReview.label,
      },
      {
        title: GETTING_STARTED_HELP_PRIMARY_ACTIONS.sampleReview.label,
        description: "Walk through a labeled sample from sealed review record to sponsor-ready exports.",
        href: GETTING_STARTED_HELP_PRIMARY_ACTIONS.sampleReview.href,
        ctaLabel: GETTING_STARTED_HELP_PRIMARY_ACTIONS.sampleReview.label,
      },
      {
        title: "First review guide",
        description: "Step through the guided first-review workflow.",
        href: GETTING_STARTED_HELP_PRIMARY_ACTIONS.firstReviewGuide.href,
        ctaLabel: GETTING_STARTED_HELP_PRIMARY_ACTIONS.firstReviewGuide.label,
      },
    ];
  }

  return [
    {
      title: "New review",
      description: "Open the draft editor and start a new architecture review.",
      href: "/architecture/architectures/new",
      ctaLabel: "New review",
    },
    {
      title: "Resume drafts",
      description: "Open saved architecture drafts before filing evidence for review.",
      href: "/architecture/architectures",
      ctaLabel: "Open drafts",
    },
    {
      title: WORKING_REVIEWS_INBOX_NAV_LABEL,
      description: "Resume in-progress or finalized architecture reviews in this workspace.",
      href: REVIEWS_LIST_PATH,
      ctaLabel: WORKING_REVIEWS_INBOX_NAV_LABEL,
    },
  ];
}

export function resolveGettingStartedHelpNextActionCards(
  workingMode: boolean,
): readonly GettingStartedActionCard[] {
  if (!workingMode) {
    return GETTING_STARTED_HELP_NEXT_ACTION_CARDS;
  }

  return GETTING_STARTED_HELP_NEXT_ACTION_CARDS.filter(
    (card) => !card.href.includes("/see-it") && !card.title.toLowerCase().includes("first review"),
  );
}

export const GETTING_STARTED_HELP_PRIMARY_ACTIONS = {
  startReview: { href: "/architecture/reviews/new", label: BUYER_START_ARCHITECTURE_REVIEW_CTA },
  sampleReview: { href: sampleReviewHref, label: GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA },
  firstReviewGuide: { href: inAppHelpHref("first-architecture-review"), label: "View first review guide" },
} as const;

export const GETTING_STARTED_HELP_NEXT_ACTION_CARDS: readonly GettingStartedActionCard[] = [
  {
    title: "Start your first review",
    description: "Create a review and add evidence — cloud connectors are optional.",
    href: "/architecture/reviews/new",
    ctaLabel: BUYER_START_ARCHITECTURE_REVIEW_CTA,
  },
  {
    title: GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_TITLE,
    description: "Walk through a labeled sample from sealed review record to sponsor-ready exports.",
    href: sampleReviewHref,
    ctaLabel: GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA,
  },
  {
    title: "Learn the vocabulary",
    description: "Scan the plain-language terms used across review, approval, and exports.",
    href: "#plain-language-vocabulary",
    ctaLabel: "View vocabulary",
  },
  {
    title: "Connect cloud evidence later",
    description: "Add read-only Azure, AWS, or GCP connectors when live inventory is required.",
    href: "/integrations/cloud-connections",
    ctaLabel: "Cloud connections",
  },
];

export const GETTING_STARTED_HELP_TECHNICAL_DETAILS_TITLE = "Technical details for administrators";

export const GETTING_STARTED_HELP_TECHNICAL_DETAILS_BODY =
  "Engineering and platform teams may need the following implementation mapping when integrating ArchLucid with internal systems.";

export const GETTING_STARTED_HELP_TECHNICAL_TERMS: readonly GettingStartedPlainLanguageTerm[] = [
  {
    term: "Review session identifier (runId)",
    definition:
      "API and storage key for one architecture review session from intake through finalize.",
  },
  {
    term: "Manifest identifier",
    definition: "Immutable snapshot id produced when a review is finalized.",
  },
  {
    term: "Context snapshot",
    definition: "Normalized intake payload combining description, hints, documents, and IaC snippets.",
  },
  {
    term: "Authority orchestration",
    definition: "Server-side pipeline that coordinates architecture structure, cost, compliance, and critic agents.",
  },
  {
    term: "Explainability trace",
    definition: "Metadata attached to findings for audit and evidence inspection surfaces.",
  },
  {
    term: "Approval gate",
    definition: "Configurable blocker on finalize when severity thresholds are breached.",
  },
];

export function resolveGettingStartedHelpTechnicalTerms(
  workingMode: boolean,
): readonly GettingStartedPlainLanguageTerm[] {
  if (!workingMode) {
    return GETTING_STARTED_HELP_TECHNICAL_TERMS;
  }

  return GETTING_STARTED_HELP_TECHNICAL_TERMS.filter(
    (term) => term.term !== "Authority orchestration",
  );
}

export const GETTING_STARTED_HELP_DIAGRAM_SOURCE = `flowchart LR
  subgraph ingest [Request]
    AR[Architecture request]
    R[Review session]
  end
  subgraph pipeline [Authority pipeline]
    CI[Context ingestion]
    KG[Knowledge graph stage]
    FD[Findings]
    DV[Decisioning]
    ART[Artifacts]
  end
  subgraph outputs [Committed outputs]
    SR[Sealed review record]
    PKG[Downloads / exports]
  end
  AR --> CI --> KG --> FD --> DV --> ART
  R -.created at start.- CI
  FD --> gov{Approval gate}
  gov -->|allow| SR
  gov -->|block / warn policy| gov
  SR --> PKG`;

export const GETTING_STARTED_HELP_DIAGRAM_SOURCE_WORKING = `flowchart LR
  subgraph ingest [Request]
    AR[Architecture request]
    R[Review session]
  end
  subgraph analysis [Review analysis]
    CI[Context ingestion]
    FD[Findings]
    DV[Decisions]
    ART[Export-ready outputs]
  end
  subgraph outputs [Committed outputs]
    SR[Sealed review record]
    PKG[Downloads / exports]
  end
  AR --> CI --> FD --> DV --> ART
  R -.created at start.- CI
  FD --> gov{Approval gate}
  gov -->|allow| SR
  gov -->|block / warn policy| gov
  SR --> PKG`;

export function resolveGettingStartedHelpDiagramSource(workingMode: boolean): string {
  return workingMode ? GETTING_STARTED_HELP_DIAGRAM_SOURCE_WORKING : GETTING_STARTED_HELP_DIAGRAM_SOURCE;
}

export const SECURENOW_GETTING_STARTED_HELP_QUICK_START_TITLE = "Start with cloud evidence and ARC-AMPE packs";

export const SECURENOW_GETTING_STARTED_HELP_QUICK_START_COPY =
  "Connect Azure or upload inventory, assign policy packs, triage findings, and open remediation or infrastructure workbenches.";

export const SECURENOW_GETTING_STARTED_HELP_DIAGRAM_SUMMARY =
  "SecureNow ingests cloud inventory evidence, evaluates ARC-AMPE policy packs, and surfaces findings you can triage, remediate, and trace through infrastructure workbenches.";

export const SECURENOW_GETTING_STARTED_HELP_DIAGRAM_STEPS = [
  "Cloud inventory",
  "ARC-AMPE evaluation",
  "Findings",
  "Remediation",
  "Infrastructure workbenches",
] as const;

export const SECURENOW_GETTING_STARTED_HELP_PIPELINE_TEXT_STAGES = [
  "Connect Azure or upload a validated inventory ZIP for cloud evidence intake.",
  "Assign ARC-AMPE policy packs and tune priority floors for the active workspace scope.",
  "Open findings or assigned-to-me to triage severity, owners, and evidence links.",
  "Run remediation factory workflows or open infrastructure workbenches for follow-up.",
] as const;

export const SECURENOW_GETTING_STARTED_HELP_PIPELINE_DIAGRAM_DESCRIPTION =
  "Stages from cloud inventory intake through ARC-AMPE pack evaluation, findings triage, remediation workflows, and infrastructure workbench follow-up.";

export const SECURENOW_GETTING_STARTED_HELP_PIPELINE_INTRO =
  "SecureNow workflow from cloud evidence intake through findings and remediation follow-up:";

export const SECURENOW_GETTING_STARTED_HELP_DIAGRAM_SOURCE = `flowchart LR
  subgraph ingest [Evidence intake]
    AZ[Azure connector or ZIP upload]
    INV[Cloud inventory snapshot]
  end
  subgraph evaluate [ARC-AMPE evaluation]
    PACK[Policy pack assignment]
    RULES[Effective rules]
    FIND[Findings]
  end
  subgraph operate [Operate]
    TRIAGE[Findings triage]
    REM[Remediation workflows]
    WB[Infrastructure workbenches]
  end
  AZ --> INV --> PACK --> RULES --> FIND
  FIND --> TRIAGE --> REM --> WB`;

export const SECURENOW_GETTING_STARTED_HELP_SOURCES: readonly GettingStartedHelpSourceLink[] = [
  { label: "Assigned to me", href: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH },
  { label: "Open policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Azure connections", href: "/integrations/cloud-connections" },
  { label: "Resource explorer", href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
] as const;

export const SECURENOW_GETTING_STARTED_HELP_WORKFLOW_STEPS: readonly GettingStartedWorkflowStep[] = [
  {
    stepNumber: 1,
    title: "Connect cloud inventory evidence",
    description: "Connect Azure for read-only inventory or upload a validated ZIP from Extract and upload.",
    expectedOutputs: "Inventory evidence indexed for ARC-AMPE scans.",
    href: "/integrations/cloud-connections",
    ctaLabel: "Azure connections",
  },
  {
    stepNumber: 2,
    title: "Assign ARC-AMPE policy packs",
    description: "Assign the bundled Architecture Themes pack and tune priority floors for cloud evidence scans.",
    expectedOutputs: "Effective rules ready for the active workspace scope.",
    href: GOVERNANCE_POLICY_PACKS_PATH,
    ctaLabel: "Open policy packs",
  },
  {
    stepNumber: 3,
    title: "Triage findings",
    description: "Review open findings raised against connected inventory and assign remediation owners.",
    expectedOutputs: "Prioritized findings with owners and evidence links.",
    href: GOVERNANCE_FINDINGS_PATH,
    ctaLabel: "Open findings queue",
  },
  {
    stepNumber: 4,
    title: "Work assigned findings",
    description: "Open your assigned-to-me lane or remediation factory to continue remediation work.",
    expectedOutputs: "Assigned findings progressing through remediation.",
    href: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
    ctaLabel: "Open assigned to me",
  },
  {
    stepNumber: 5,
    title: "Inspect infrastructure evidence",
    description: "Open resource explorer, diagrams, or drift workbenches when findings need inventory context.",
    expectedOutputs: "Traceable inventory context for findings and lineage exports.",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
    ctaLabel: "Open resource explorer",
  },
] as const;

export const SECURENOW_GETTING_STARTED_HELP_NEXT_ACTION_CARDS: readonly GettingStartedActionCard[] = [
  {
    title: "Connect Azure inventory",
    description: "Add a read-only Azure connector or upload a validated inventory ZIP.",
    href: "/integrations/cloud-connections",
    ctaLabel: "Azure connections",
  },
  {
    title: "Assign policy packs",
    description: "Assign ARC-AMPE packs and tune priority floors for cloud evidence scans.",
    href: GOVERNANCE_POLICY_PACKS_PATH,
    ctaLabel: "Open policy packs",
  },
  {
    title: "Triage assigned findings",
    description: "Open findings assigned to you for remediation and follow-up.",
    href: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
    ctaLabel: "Open assigned to me",
  },
  {
    title: "Review assurance posture",
    description: "Open Security and trust when procurement or diligence questions need official materials.",
    href: inAppHelpHref("security-trust"),
    ctaLabel: "Security and trust",
  },
] as const;

export const SECURENOW_GETTING_STARTED_HELP_PRIMARY_ACTIONS: readonly GettingStartedActionCard[] = [
  {
    title: "Azure connections",
    description: SECURENOW_GETTING_STARTED_HELP_QUICK_START_COPY,
    href: "/integrations/cloud-connections",
    ctaLabel: "Connect Azure",
  },
  {
    title: "Policy packs",
    description: "Assign ARC-AMPE packs before expecting inventory-backed findings.",
    href: GOVERNANCE_POLICY_PACKS_PATH,
    ctaLabel: "Open policy packs",
  },
  {
    title: "Assigned to me",
    description: "Continue findings assigned to you for remediation work.",
    href: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
    ctaLabel: "Open assigned to me",
  },
] as const;

export const SECURENOW_GETTING_STARTED_HELP_AUDIENCE_LINE =
  "For security operators, compliance leads, and platform admins orienting to cloud evidence, ARC-AMPE findings, and remediation workflows.";

export function resolveGettingStartedHelpQuickStartTitle(
  workingMode: boolean,
  productLineId: ProductLineId = "architecture",
): string {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GETTING_STARTED_HELP_QUICK_START_TITLE;
  }

  return resolveGettingStartedHelpQuickStartTitleLegacy(workingMode);
}

function resolveGettingStartedHelpQuickStartTitleLegacy(workingMode: boolean): string {
  return workingMode ? GETTING_STARTED_HELP_WORKING_QUICK_START_TITLE : GETTING_STARTED_HELP_QUICK_START_TITLE;
}

export function resolveGettingStartedHelpQuickStartCopy(
  workingMode: boolean,
  productLineId: ProductLineId = "architecture",
): string {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GETTING_STARTED_HELP_QUICK_START_COPY;
  }

  return resolveGettingStartedHelpQuickStartCopyLegacy(workingMode);
}

function resolveGettingStartedHelpQuickStartCopyLegacy(workingMode: boolean): string {
  return workingMode ? GETTING_STARTED_HELP_WORKING_QUICK_START_COPY : GETTING_STARTED_HELP_QUICK_START_COPY;
}

export function resolveGettingStartedHelpDiagramSummary(productLineId: ProductLineId = "architecture"): string {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GETTING_STARTED_HELP_DIAGRAM_SUMMARY;
  }

  return GETTING_STARTED_HELP_DIAGRAM_SUMMARY;
}

export function resolveGettingStartedHelpDiagramSteps(
  productLineId: ProductLineId = "architecture",
): readonly string[] {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GETTING_STARTED_HELP_DIAGRAM_STEPS;
  }

  return GETTING_STARTED_HELP_DIAGRAM_STEPS;
}

export function resolveGettingStartedHelpPipelineTextStagesForProductLine(
  workingMode: boolean,
  productLineId: ProductLineId = "architecture",
): readonly string[] {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GETTING_STARTED_HELP_PIPELINE_TEXT_STAGES;
  }

  return resolveGettingStartedHelpPipelineTextStages(workingMode);
}

export function resolveGettingStartedHelpPipelineDiagramDescriptionForProductLine(
  workingMode: boolean,
  productLineId: ProductLineId = "architecture",
): string {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GETTING_STARTED_HELP_PIPELINE_DIAGRAM_DESCRIPTION;
  }

  return resolveGettingStartedHelpPipelineDiagramDescription(workingMode);
}

export function resolveGettingStartedHelpPipelineIntroForProductLine(
  workingMode: boolean,
  productLineId: ProductLineId = "architecture",
): string {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GETTING_STARTED_HELP_PIPELINE_INTRO;
  }

  return resolveGettingStartedHelpPipelineIntro(workingMode);
}

export function resolveGettingStartedHelpPipelineDiagramAccessibleNameForProductLine(
  workingMode: boolean,
  productLineId: ProductLineId = "architecture",
): string {
  if (isSecureNowProductLine(productLineId)) {
    return "SecureNow cloud evidence workflow";
  }

  return resolveGettingStartedHelpPipelineDiagramAccessibleName(workingMode);
}

export function resolveGettingStartedHelpDiagramSourceForProductLine(
  workingMode: boolean,
  productLineId: ProductLineId = "architecture",
): string {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GETTING_STARTED_HELP_DIAGRAM_SOURCE;
  }

  return resolveGettingStartedHelpDiagramSource(workingMode);
}

export function resolveGettingStartedHelpSources(
  productLineId: ProductLineId = "architecture",
): readonly GettingStartedHelpSourceLink[] {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GETTING_STARTED_HELP_SOURCES;
  }

  return GETTING_STARTED_HELP_SOURCES;
}

export function resolveGettingStartedHelpWorkflowStepsForProductLine(
  workingMode: boolean,
  productLineId: ProductLineId = "architecture",
): readonly GettingStartedWorkflowStep[] {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GETTING_STARTED_HELP_WORKFLOW_STEPS;
  }

  return resolveGettingStartedHelpWorkflowSteps(workingMode);
}

export function resolveGettingStartedHelpNextActionCardsForProductLine(
  workingMode: boolean,
  productLineId: ProductLineId = "architecture",
): readonly GettingStartedActionCard[] {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GETTING_STARTED_HELP_NEXT_ACTION_CARDS;
  }

  return resolveGettingStartedHelpNextActionCards(workingMode);
}

export function resolveGettingStartedHelpPrimaryActionsForProductLine(
  workingMode: boolean,
  productLineId: ProductLineId = "architecture",
): readonly GettingStartedActionCard[] {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GETTING_STARTED_HELP_PRIMARY_ACTIONS;
  }

  return resolveGettingStartedHelpPrimaryActions(workingMode);
}

export function resolveGettingStartedHelpAudienceLine(productLineId: ProductLineId = "architecture"): string {
  if (isSecureNowProductLine(productLineId)) {
    return SECURENOW_GETTING_STARTED_HELP_AUDIENCE_LINE;
  }

  return GETTING_STARTED_HELP_AUDIENCE_LINE;
}

export function resolveGettingStartedHelpWorkflowSectionTitle(productLineId: ProductLineId = "architecture"): string {
  if (isSecureNowProductLine(productLineId)) {
    return "What happens during SecureNow operations?";
  }

  return "What happens during a review?";
}

export const GETTING_STARTED_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "quick-start", title: GETTING_STARTED_HELP_QUICK_START_TITLE },
  { level: 2, id: "what-to-do-next", title: "What to do next" },
  { level: 2, id: "how-archlucid-works", title: GETTING_STARTED_HELP_DIAGRAM_TITLE },
  { level: 2, id: "plain-language-vocabulary", title: "Plain-language vocabulary" },
  { level: 2, id: "what-happens-during-a-review", title: "What happens during a review?" },
  { level: 2, id: "technical-details", title: GETTING_STARTED_HELP_TECHNICAL_DETAILS_TITLE },
];
