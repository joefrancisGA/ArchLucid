/**
 * In-product copy for **Pilot** (Layer A) and **Advanced operations / Governance** surfaces (Layer B) — **`docs/library/PRODUCT_PACKAGING.md`**
 * ("Layer A — Pilot", "Layer B — Operate" in docs; **Advanced operations** = deep-dive, **Governance** = approvals, audit, alerts, policy).
 * **`docs/OPERATOR_DECISION_GUIDE.md`**. Consumed by **`LayerHeader`** (`LayerGuidancePageKey` per route family).
 *
 * **UI shaping only:** explains layer / when-to-use; does not grant access. **`[Authorize(Policy = …)]`** on **ArchLucid.Api** is
 * **authoritative** (**401/403**). This file does not implement **nav** (**`nav-config.ts`** + **`nav-shell-visibility.ts`**) or
 * **Execute+ mutation soft-disable** (**`operate-capability.ts`** / **`useOperateCapability()`**).
 *
 * **Governance strip:** blocks with a non-null **`enterpriseFootnote`** are the **governance / trust** slice — **`LayerHeader`**
 * uses that footnote for typography and the **Execute+** rank cue strip. **Advanced operations** rows omit **`enterpriseFootnote`**.
 * **`authority-seam-regression.test.ts`** locks that contract.
 *
 * **`enterpriseFootnote`** on Enterprise keys complements **`nav-config.ts`** group **captions** — same buyer story, different surface.
 *
 * **Vocabulary:** operator copy uses **architecture review** (not “run”) in headings and guidance; API `runId` paths are unchanged.
 * Relationship copy for review / manifest / trace lives in **`architecture-review-vocabulary.ts`** and **`LayerHeader`**.
 *
 * **Drift guard:** adding a key requires wiring **`LayerHeader`** on the page and, if the capability is listed for
 * buyers, updating **PRODUCT_PACKAGING.md** — see §3 *Contributor drift guard* (*Guidance strip* step).
 */

export type LayerGuidancePageKey =
  | "compare"
  | "replay"
  | "graph"
  | "integrations-operations"
  | "webhooks"
  | "governance-dashboard"
  | "governance-findings"
  | "governance-setup"
  | "governance-resolution"
  | "governance-workflow"
  | "recurrence-schedules"
  | "exceptions"
  | "policy-packs"
  | "alert-rules"
  | "alert-routing"
  | "alert-simulation"
  | "alert-tuning"
  | "composite-alert-rules"
  | "alerts"
  | "audit"
  | "value-report"
  | "value-report-pilot"
  | "value-report-roi"
  | "security-trust"
  | "teams-notifications"
  | "itsm-connectors"
  | "slack-notifications"
  | "infrastructure-overview"
  | "infrastructure-drift"
  | "infrastructure-terraform"
  | "infrastructure-diagrams"
  | "infrastructure-diagram-reconcile"
  | "infrastructure-resources"
  | "infrastructure-ask"
  | "infrastructure-remediation";

export type LayerGuidanceBlock = {
  /** Short badge — **Advanced operations** (deep-dive) vs **Governance** (approvals, audit, alerts, policy); governance rows set `enterpriseFootnote`. */
  layerBadge: string;
  /** One line: what question this surface answers */
  headline: string;
  /** When to use it (one sentence) */
  useWhen: string;
  /** Optional framing relative to Pilot (first proof — ee PRODUCT_PACKAGING "Not required for first Pilot proof" sections. */
  firstPilotNote: string | null;
  /**
   * Optional one line for **Operate · governance** pages: who usually owns the surface vs Pilot default.
   * See docs/OPERATOR_DECISION_GUIDE.md §2.
   */
  enterpriseFootnote?: string | null;
  /** When true, omit the global review-package vocabulary strip (integration/admin surfaces). */
  omitReviewPackageScopeHelp?: boolean;
};

export const LAYER_PAGE_GUIDANCE: Record<LayerGuidancePageKey, LayerGuidanceBlock> = {
  compare: {
    layerBadge: "Compare two reviews",
    headline: "See what changed between two finalized reviews.",
    useWhen: "Choose a baseline and an updated review after both packages are finalized.",
    firstPilotNote:
      "Optional until first Pilot proof unless you deliberately compare two finalized reviews.",
  },
  replay: {
    layerBadge: "Advanced operations",
    headline: "Answers: does stored review output still validate for this review?",
    useWhen: "Use when you need drift or integrity checks on a single review, not a visual diff.",
    firstPilotNote: "Typically after Pilot proof when you validate stored review chains.",
  },
  graph: {
    layerBadge: "Evidence graph",
    headline: "Trace review evidence from inputs to findings, decisions, and audit events.",
    useWhen: "Select a finalized review, choose a graph scope, load the graph, then inspect provenance.",
    firstPilotNote:
      "Best once you have a finalized revie —  graph complements architecture snapshot and finding tables when stakeholders need visuals.",
  },
  "integrations-operations": {
    layerBadge: "Integration readiness",
    headline: "Check whether notification, ticketing, publishing, and messaging integrations are configured for this workspace.",
    useWhen:
      "Use this page to verify connector readiness before enabling notifications, ticket creation, publishing, or scheduled digests.",
    firstPilotNote:
      "These connectors are optional for first review value; full native Jira and ServiceNow operations are not required for Pilot proof.",
    omitReviewPackageScopeHelp: true,
  },
  webhooks: {
    layerBadge: "Integration configuration",
    headline: "Configure outbound HTTPS webhook subscriptions for custom event delivery.",
    useWhen:
      "Use when you need ArchLucid to POST signed events to your own HTTPS collectors — not for standard Teams channel setup.",
    firstPilotNote:
      "Optional until you connect monitoring or automation; use Microsoft Teams notifications for guided Teams wiring.",
    omitReviewPackageScopeHelp: true,
  },
  "governance-dashboard": {
    layerBadge: "Insights",
    headline: "Workspace health — approval and value signals in your current scope.",
    useWhen:
      "Use after Pilot proof when sponsors need pre-finalization outcomes, severity exposure, compliance drift, SLA posture, and a hours-first value proxy.",
    firstPilotNote: "Optional until first Pilot proof; data is scoped to the active tenant/workspace/project.",
    enterpriseFootnote: "Read-only tiles; writes stay in workflow, findings queue, and audit.",
  },
  "governance-findings": {
    layerBadge: "Findings",
    headline:
      "Track architecture risks created from accepted findings, waivers, exceptions, and approval decisions.",
    useWhen:
      "Use this register to assign owners, monitor aging risks, review exceptions before expiry, and prepare audit evidence.",
    firstPilotNote:
      "After Pilot proof, use review detail for drill-down; this register queues portfolio-level owned risks and decisions.",
    enterpriseFootnote:
      "Each risk should remain traceable to the review, evidence, policy rule, and sealed review record that produced it.",
    omitReviewPackageScopeHelp: true,
  },
  "governance-setup": {
    layerBadge: "Approval",
    headline: "Establish policies, alerts, approvals, and reporting for this workspace.",
    useWhen:
      "Work the checklist in orde — ach step opens the configuration surface where changes are made and audited.",
    firstPilotNote:
      "Optional after first Pilot proof when sponsors want a minimal enterprise cadence on one baseline.",
    enterpriseFootnote: "Configuration changes happen on the linked surfaces, not on this checklist page.",
  },
  alerts: {
    layerBadge: "Approval",
    headline: "Risk and compliance signals that need triage.",
    useWhen: "Work the inbox first; configure rules and routing on Alert rules.",
    firstPilotNote: "Inbox first; rule tooling after Pilot proof when volume warrants it.",
    enterpriseFootnote: "Inbox first; configuration tabs when your role allows.",
  },
  audit: {
    layerBadge: "Approval",
    headline: "Tenant audit trai — ho did what, when.",
    useWhen: "Search and filter audit events; export requires Auditor or Admin access.",
    firstPilotNote: "Bounded export after Pilot proof when audit window and roles are clear.",
    enterpriseFootnote: "Search first; CSV export for auditors and admins.",
  },
  "security-trust": {
    layerBadge: "Security & Trust",
    headline: "Security materials for procurement, vendor review, and enterprise trust.",
    useWhen:
      "Share procurement-ready security materials, trust-center links, and assessment status for this workspace.",
    firstPilotNote: null,
    omitReviewPackageScopeHelp: true,
  },
  "teams-notifications": {
    layerBadge: "Approval",
    headline: "Microsoft Teams channel wiring for integration-event fan-out.",
    useWhen: "After Service Bus topics are live and your team wants review / approval / alert cards in Teams.",
    firstPilotNote:
      "After Pilot proof when Teams routing matters; store only a Key Vault secret id here.",
    enterpriseFootnote: "Read vs Execute matches API; Logic Apps resolves the secret at delivery time.",
  },
  "itsm-connectors": {
    layerBadge: "Integration configuration",
    headline: "Per-tenant Jira and ServiceNow connector references plus outbound routing overrides.",
    useWhen:
      "Configure Key Vault secret names, instance URLs, and optional project or CMDB behavior before enabling native ticket create.",
    firstPilotNote:
      "Optional until ITSM handoff is in scope; deployment-wide credentials still work for single-tenant pilots.",
    omitReviewPackageScopeHelp: true,
  },
  "slack-notifications": {
    layerBadge: "Approval",
    headline: "Slack channel wiring for architecture alert delivery.",
    useWhen: "When your team wants alert notifications in Slack channels via incoming webhook URLs.",
    firstPilotNote: "Optional until alert routing to Slack is part of your operating model.",
    enterpriseFootnote: "Read vs Execute matches API; webhook secrets are stored with each route.",
  },
  "value-report-pilot": {
    layerBadge: "Sponsor report",
    headline: "Pilot outcomes from finalized reviews for sponsor sponsors.",
    useWhen:
      "After you finalize a review, summarize pilot outcomes here — activity, findings, approval decisions, and exportable sponsor proof for the selected period.",
    firstPilotNote:
      "First-use path: create review → execute analysis → finalize → open pilot outcomes on this page (or export from review detail).",
    omitReviewPackageScopeHelp: true,
  },
  "value-report-roi": {
    layerBadge: "Sponsor report",
    headline: "Estimated hours saved from review findings and approval blocks.",
    useWhen:
      "When champions need a defensible hours story before negotiating loaded cost internally; pairs with Workspace health.",
    firstPilotNote: "Hours-first estimate from finalized reviews in the selected period.",
    omitReviewPackageScopeHelp: true,
  },
  "value-report": {
    layerBadge: "Sponsor report",
    headline: "Create a sponsor-ready report summarizing finalized reviews, findings, approval activity, and estimated ROI.",
    useWhen: "Generate sponsor and board-ready exports after you have finalized reviews in the selected period.",
    firstPilotNote: "After pilot outcomes when sponsors need a packaged value narrative.",
    enterpriseFootnote: "Standard tier required; cost estimate is hours-first from review severities.",
    omitReviewPackageScopeHelp: true,
  },
  "governance-resolution": {
    layerBadge: "Approval",
    headline: "Diagnose effective policy, conflicts, and precedence for this scope.",
    useWhen:
      "Use after changing policy pack assignments or approval workflow settings to confirm what is in effect.",
    firstPilotNote: "After Pilot proof when merge order or conflicts need review.",
    enterpriseFootnote: "Read-only diagnostic; edits on Policy packs or Approval workflow.",
    omitReviewPackageScopeHelp: true,
  },
  "governance-workflow": {
    layerBadge: "Approval",
    headline: "Record and inspect approval decisions for finalized reviews.",
    useWhen:
      "Pick a review to see approval status and decision history, or work pending requests from the workspace queue.",
    firstPilotNote:
      "After Pilot proof when your team records formal approval decisions on finalized packages.",
    enterpriseFootnote:
      "Authorized roles submit, approve, and reject requests; every decision is recorded in the audit trail.",
  },
  "recurrence-schedules": {
    layerBadge: "Approval",
    headline:
      "Define repeatable review cadences for finalized architecture reviews — quarterly control reviews, annual policy attestations, post-remediation follow-ups, and architecture board checkpoints.",
    useWhen:
      "Create a schedule when a formal review must be re-reviewed on a fixed cadence so accepted risks, policy exceptions, and control obligations do not lapse after approval.",
    firstPilotNote:
      "After Pilot proof when approval leads need automated follow-up instead of calendar reminders for recurring architecture reviews.",
    enterpriseFootnote:
      "Schedules clone a finalized review on the cadence you define; manage approvals and risk disposition on linked approval surfaces.",
  },
  exceptions: {
    layerBadge: "Approval",
    headline: "Track active waivers, expirations, owners, and linked approval decisions.",
    useWhen:
      "Use this page to track owner, expiration, evidence, and the linked decision so exceptions do not become unmanaged risk.",
    firstPilotNote:
      "After Pilot proof when waivers from findings need portfolio-level expiry and renewal tracking.",
    enterpriseFootnote:
      "Risk exceptions are approved waivers for findings that are not immediately remediated.",
  },
  "policy-packs": {
    layerBadge: "Approval",
    headline: "Packs in scope, published versions, and effective policy.",
    useWhen: "Start by reviewing inventory and diffs; publish or assign when your role allows.",
    firstPilotNote: "After Pilot proof when you steward pack publish and assignment.",
    enterpriseFootnote: "Inspect registered packs and active policy rule layers for your scope.",
  },
  "alert-rules": {
    layerBadge: "Approval",
    headline: "Finding thresholds that raise alerts after completed reviews.",
    useWhen: "Define thresholds here; triage raised alerts on Alerts.",
    firstPilotNote: "Threshold tuning after Pilot proof when reviews drive production signals.",
    enterpriseFootnote: "Thresholds on review findings.",
  },
  "alert-routing": {
    layerBadge: "Approval",
    headline: "Where fired alerts are delivered.",
    useWhen: "Targets for fired alert — ot digest mail.",
    firstPilotNote: "Destinations after Pilot proof when fired alerts need routing.",
    enterpriseFootnote: "Delivery targets for fired alerts.",
  },
  "alert-simulation": {
    layerBadge: "Approval",
    headline: "Dry-run rules against recent reviews.",
    useWhen: "What-if before changing production thresholds; triage on Alerts.",
    firstPilotNote: "What-if after Pilot proof before changing live thresholds.",
    enterpriseFootnote: "Simulation before production change.",
  },
  "alert-tuning": {
    layerBadge: "Approval",
    headline: "Balance coverage vs. noise for one rule.",
    useWhen: "After simulation shows a tradeoff worth fixing.",
    firstPilotNote: "After Pilot proof when simulation evidence backs a live change.",
    enterpriseFootnote: "Tuning from simulation evidence.",
  },
  "composite-alert-rules": {
    layerBadge: "Approval",
    headline: "Combine metrics with AND/OR before firing.",
    useWhen: "Use when one metric is not enough; add cooldown as needed.",
    firstPilotNote: "Composite rules after Pilot proof when AND/OR firing is in scope.",
    enterpriseFootnote: "AND/OR and cooldown configuration.",
  },
  "infrastructure-overview": {
    layerBadge: "Advanced operations",
    headline: "Directory for Azure inventory evidence workbenches.",
    useWhen: "Open a workbench when you need snapshots, diagrams, resource evidence, Ask, or remediation instances.",
    firstPilotNote: "Optional until cloud inventory snapshots exist for your scope.",
    omitReviewPackageScopeHelp: true,
  },
  "infrastructure-drift": {
    layerBadge: "Advanced operations",
    headline: "Compare inventory snapshots and classify drift.",
    useWhen: "Pick current and baseline snapshots before exporting advisory Terraform.",
    firstPilotNote: "Compare snapshots after cloud inventory capture exists for your scope.",
    omitReviewPackageScopeHelp: true,
  },
  "infrastructure-terraform": {
    layerBadge: "Advanced operations",
    headline: "Review advisory Terraform mapping for a scoped resource.",
    useWhen: "Confirm the reconstructed Terraform address and generation method before exporting from drift.",
    firstPilotNote: "Advisory mapping is reconstructed from snapshot evidence — not original Terraform.",
    omitReviewPackageScopeHelp: true,
  },
  "infrastructure-diagrams": {
    layerBadge: "Advanced operations",
    headline: "Render inventory diagrams at scale with honest partitioned fallbacks.",
    useWhen: "Choose a snapshot and diagram mode before exporting PNG or Mermaid.",
    firstPilotNote: "Partitioned views default to Executive when the full graph exceeds readability thresholds.",
    omitReviewPackageScopeHelp: true,
  },
  "infrastructure-diagram-reconcile": {
    layerBadge: "Advanced operations",
    headline: "Reconcile diagrams against inventory snapshots.",
    useWhen: "Upload or select a diagram, pick a snapshot, then review correspondence rows.",
    firstPilotNote: "Conflict rows show both diagram and inventory sides; create operational findings without leaving the page.",
    omitReviewPackageScopeHelp: true,
  },
  "infrastructure-resources": {
    layerBadge: "Advanced operations",
    headline: "Search cloud resources and open the evidence hub.",
    useWhen: "Find a resource by name or type, then inspect drift, diagrams, and findings in one place.",
    firstPilotNote: "Open a resource row to inspect drift, diagrams, findings, and audit lineage in one hub.",
    omitReviewPackageScopeHelp: true,
  },
  "infrastructure-ask": {
    layerBadge: "Advanced operations",
    headline: "Ask grounded questions about inventory evidence.",
    useWhen: "Use canned prompts or your own question when citations and InsufficientEvidence states are acceptable.",
    firstPilotNote: "Simulator mode is on by default for deterministic, citation-grounded answers.",
    omitReviewPackageScopeHelp: true,
  },
  "infrastructure-remediation": {
    layerBadge: "Advanced operations",
    headline: "Track remediation instances and waves with advisory-only execute honesty.",
    useWhen: "Review instance state, matched patterns, and emitted advisory artifacts — not terraform apply.",
    firstPilotNote: "Execute emits advisory artifacts only — verify with a later snapshot before closing.",
    omitReviewPackageScopeHelp: true,
  },
};

/**
 * When buyer demo shell env (`NEXT_PUBLIC_DEMO_MODE` or `NEXT_PUBLIC_DEMO_STATIC_OPERATOR`) is true, merge these into
 * {@link LAYER_PAGE_GUIDANCE} for sponsor-facing copy (drops roadmap footnotes where listed).
 */
const LAYER_GUIDANCE_BUYER_POLISH_PARTIAL: Partial<
  Record<LayerGuidancePageKey, Partial<LayerGuidanceBlock>>
> = {
  audit: {
    headline: "Audit trail for finalized review activity.",
    useWhen:
      "See who acted, when, and why — filter when needed; download the approval evidence bundle when ready.",
    firstPilotNote: null,
    enterpriseFootnote:
      "Audit exports are available only to authorized audit or workspace administrators.",
  },
  alerts: {
    headline: "Operational and compliance signals.",
    useWhen: "Review open items and triage when your role allows.",
    firstPilotNote: null,
    enterpriseFootnote: "Configuration tabs appear when your role allows.",
  },
  graph: {
    layerBadge: "Evidence graph",
    headline:
      "Use this page to trace review evidence — see how architecture inputs, pipeline steps, findings, decisions, and audit events connect for a finalized review.",
    useWhen:
      "Select a review, choose a graph scope, load the graph, then inspect provenance links and open related findings.",
    firstPilotNote: null,
  },
  compare: {
    layerBadge: "Compare two reviews",
    headline: "See what changed between two finalized reviews.",
    useWhen: "Choose a baseline and an updated review after both packages are finalized.",
    firstPilotNote: null,
  },
  "governance-findings": {
    headline: "Review records, decisions, and monitoring actions tied to this review.",
    useWhen:
      "Scan dispositions alongside the approval — findings, recorded decisions, and follow-up monitors in one ledger.",
    firstPilotNote: null,
    enterpriseFootnote:
      "Review administrators and approval reviewers use review detail for deep inspection; approval remains the authoritative checkpoint.",
  },
  "policy-packs": {
    useWhen: "See which policy packs apply in this workspace and how they combine.",
    firstPilotNote: null,
  },
  "governance-workflow": {
    headline: "Record and inspect approval decisions for finalized reviews.",
    useWhen:
      "Browse pending approvals for your workspace, or load a review to see its submission and decision trail.",
    firstPilotNote: null,
    enterpriseFootnote:
      "Authorized roles submit, approve, and reject requests; every decision is recorded in the audit trail.",
    omitReviewPackageScopeHelp: true,
  },
};

/** @see LAYER_GUIDANCE_BUYER_POLISH_PARTIAL */
export function mergeLayerGuidanceForBuyerDemoShell(
  pageKey: LayerGuidancePageKey,
  base: LayerGuidanceBlock,
  buyerDemoShell: boolean,
): LayerGuidanceBlock {
  if (!buyerDemoShell) {
    return base;
  }

  const extra = LAYER_GUIDANCE_BUYER_POLISH_PARTIAL[pageKey];

  if (extra === undefined || Object.keys(extra).length === 0) {
    return base;
  }

  return { ...base, ...extra };
}

/** Graph page disclosure — softened copy for both operator and buyer shells. */
export function mergeLayerGuidanceForGraphDisclosure(base: LayerGuidanceBlock): LayerGuidanceBlock {
  const extra = LAYER_GUIDANCE_BUYER_POLISH_PARTIAL.graph;

  if (extra === undefined || Object.keys(extra).length === 0) {
    return base;
  }

  return { ...base, ...extra };
}
