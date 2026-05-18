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
 * **Drift guard:** adding a key requires wiring **`LayerHeader`** on the page and, if the capability is listed for
 * buyers, updating **PRODUCT_PACKAGING.md** — see §3 *Contributor drift guard* (*Guidance strip* step).
 */

export type LayerGuidancePageKey =
  | "compare"
  | "replay"
  | "graph"
  | "integrations-operations"
  | "governance-dashboard"
  | "governance-findings"
  | "governance-first-30-days"
  | "governance-resolution"
  | "governance-workflow"
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
  | "teams-notifications";

export type LayerGuidanceBlock = {
  /** Short badge — **Advanced operations** (deep-dive) vs **Governance** (approvals, audit, alerts, policy); governance rows set `enterpriseFootnote`. */
  layerBadge: string;
  /** One line: what question this surface answers */
  headline: string;
  /** When to use it (one sentence) */
  useWhen: string;
  /** Optional framing relative to Pilot (first proof)—see PRODUCT_PACKAGING "Not required for first Pilot proof" sections. */
  firstPilotNote: string | null;
  /**
   * Optional one line for **Operate · governance** pages: who usually owns the surface vs Pilot default.
   * See docs/OPERATOR_DECISION_GUIDE.md §2.
   */
  enterpriseFootnote?: string | null;
};

export const LAYER_PAGE_GUIDANCE: Record<LayerGuidancePageKey, LayerGuidanceBlock> = {
  compare: {
    layerBadge: "Advanced operations",
    headline: "Answers: what changed between two finalized reviews?",
    useWhen: "Use after you have two reviews with architecture snapshots when you need a structured diff or narrative.",
    firstPilotNote:
      "Optional until first Pilot proof unless you deliberately compare two finalized reviews.",
  },
  replay: {
    layerBadge: "Advanced operations",
    headline: "Answers: does stored pipeline output still validate for this review on replay?",
    useWhen: "Use when you need drift or integrity checks on a single review, not a visual diff.",
    firstPilotNote: "Typically after Pilot proof when you replay or validate chains.",
  },
  graph: {
    layerBadge: "Advanced operations",
    headline: "Answers: how does provenance or architecture look for this review?",
    useWhen: "Use when tables and compare are not enough and you need a visual exploration.",
    firstPilotNote:
      "Best once you have a finalized review—a graph complements architecture snapshot and finding tables when stakeholders need visuals.",
  },
  "integrations-operations": {
    layerBadge: "Advanced operations",
    headline: "Connector readiness across Teams, Slack, ITSM, Confluence, digests, and messaging buses.",
    useWhen:
      "Use when operators need a single read-only health view of wiring without storing connector secrets in this UI.",
    firstPilotNote:
      "After Pilot proof when integration footprint spans multiple channels and operators want a consolidated snapshot.",
  },
  "governance-dashboard": {
    layerBadge: "Governance",
    headline: "Executive Workspace Health — governance and value signals in your current scope.",
    useWhen:
      "Use after Pilot proof when sponsors need pre-finalization outcomes, severity exposure, compliance drift, SLA posture, and a hours-first value proxy.",
    firstPilotNote: "Optional until first Pilot proof; data is scoped to the active tenant/workspace/project.",
    enterpriseFootnote: "Read-only tiles; writes stay in workflow, findings queue, and audit.",
  },
  "governance-findings": {
    layerBadge: "Governance",
    headline: "Findings from architecture reviews — policy basis, analysis, and recorded dispositions.",
    useWhen: "Open a review for snapshot and explainability; use the governance dashboard for portfolio-level review context.",
    firstPilotNote:
      "After Pilot proof, use review detail for drill-down; dashboard queues portfolio governance findings.",
    enterpriseFootnote: "Review-scoped detail; portfolio governance view on governance dashboard.",
  },
  "governance-first-30-days": {
    layerBadge: "Governance",
    headline: "Preset operating checklist after Core Pilot.",
    useWhen:
      "Follow inspect-first links to policy packs, alert routing, approvals, and dashboards—no mutations initiated from this page.",
    firstPilotNote:
      "Optional rhythm after first Pilot proof when sponsors want a minimal enterprise cadence anchored on one baseline each.",
    enterpriseFootnote: "Deep links only; configuration changes happen on the linked surfaces.",
  },
  alerts: {
    layerBadge: "Governance",
    headline: "Risk and compliance signals that need triage.",
    useWhen: "Work the inbox; rules, routing, composite, and simulation & tuning are tabs on the same Alerts page.",
    firstPilotNote: "Inbox first; rule tooling after Pilot proof when volume warrants it.",
    enterpriseFootnote: "Inbox first; configuration tabs when your role allows.",
  },
  audit: {
    layerBadge: "Governance",
    headline: "Tenant audit trail—who did what, when.",
    useWhen: "Search and filter audit events; export requires Auditor or Admin access.",
    firstPilotNote: "Bounded export after Pilot proof when audit window and roles are clear.",
    enterpriseFootnote: "Search first; CSV export for auditors and admins.",
  },
  "security-trust": {
    layerBadge: "Governance",
    headline: "Procurement-facing security posture and NDA-gated pen-test summaries.",
    useWhen: "Use when buyers need CAIQ/SIG pointers, Trust Center links, and the NDA path for redacted pen-test excerpts.",
    firstPilotNote:
      "Procurement/CCI, not Pilot scope. Redacted pen-test excerpts NDA-only; contact security@.",
    enterpriseFootnote: "Read-oriented; Admin API may still emit SecurityAssessmentPublished for audit/SIEM without implying public publication.",
  },
  "teams-notifications": {
    layerBadge: "Governance",
    headline: "Microsoft Teams channel wiring for integration-event fan-out.",
    useWhen: "After Service Bus topics are live and operators want review / governance / alert cards in Teams.",
    firstPilotNote:
      "After Pilot proof when Teams routing matters; store only a Key Vault secret id here.",
    enterpriseFootnote: "Read vs Execute matches API; Logic Apps resolves the secret at delivery time.",
  },
  "value-report-pilot": {
    layerBadge: "Advanced operations",
    headline: "Sponsor-ready proof snapshot without generating a DOCX.",
    useWhen:
      "When executives need totals, severities, governance signals, and a Markdown handoff aligned to a UTC measurement window.",
    firstPilotNote:
      "Complements the in-product scorecard; Read-tier API; optional during Pilot for executive visibility.",
  },
  "value-report-roi": {
    layerBadge: "Advanced operations",
    headline: "Sponsor-facing hours estimate from severities and pre-finalization blocks.",
    useWhen:
      "When champions need a defensible hours story before negotiating loaded $/hour internally; pairs with Workspace health.",
    firstPilotNote: "Read-tier data pulls; Admin-only optional USD line uses local browser override.",
  },
  "value-report": {
    layerBadge: "Governance",
    headline: "Sponsor-facing value DOCX for a UTC window.",
    useWhen: "After you have finalized reviews; pairs with ROI_MODEL for CFO-ready narrative.",
    firstPilotNote: "After Pilot proof with Standard tier when sponsor DOCX is needed.",
    enterpriseFootnote: "Execute + Standard tier on API; LLM line is estimated per ROI_MODEL when SQL token ledger absent.",
  },
  "governance-resolution": {
    layerBadge: "Governance",
    headline: "Effective policy stack for this scope.",
    useWhen: "Read ordering here; change content on Policy packs or Workflow.",
    firstPilotNote: "After Pilot proof when merge order or conflicts need resolution.",
    enterpriseFootnote: "Read-only stack; edits on Packs or Workflow.",
  },
  "governance-workflow": {
    layerBadge: "Governance",
    headline: "Submit finalized architecture outputs for governance review and promotion.",
    useWhen: "Pick one review and move from submission through approval, promotion, and activation.",
    firstPilotNote:
      "After Pilot proof when your team promotes finalized architecture snapshots through governed stages.",
    enterpriseFootnote: "Approvals follow the configured approval path for packages in this workspace.",
  },
  "policy-packs": {
    layerBadge: "Governance",
    headline: "Packs in scope, published versions, and effective policy.",
    useWhen: "Start by reviewing inventory and diffs; publish or assign when your role allows.",
    firstPilotNote: "After Pilot proof when you steward pack publish and assignment.",
    enterpriseFootnote: "Inspect registered packs and active governance rule layers for your scope.",
  },
  "alert-rules": {
    layerBadge: "Governance",
    headline: "Metric thresholds that raise alerts after scans.",
    useWhen: "Define thresholds here; triage fired alerts on Alerts.",
    firstPilotNote: "Threshold tuning after Pilot proof when scans drive production signals.",
    enterpriseFootnote: "Thresholds on scan outcomes.",
  },
  "alert-routing": {
    layerBadge: "Governance",
    headline: "Where fired alerts are delivered.",
    useWhen: "Targets for fired alerts—not digest mail.",
    firstPilotNote: "Destinations after Pilot proof when fired alerts need routing.",
    enterpriseFootnote: "Delivery targets for fired alerts.",
  },
  "alert-simulation": {
    layerBadge: "Governance",
    headline: "Dry-run rules against recent reviews.",
    useWhen: "What-if before changing production thresholds; triage on Alerts.",
    firstPilotNote: "What-if after Pilot proof before changing live thresholds.",
    enterpriseFootnote: "Simulation before production change.",
  },
  "alert-tuning": {
    layerBadge: "Governance",
    headline: "Balance coverage vs. noise for one rule.",
    useWhen: "After simulation shows a tradeoff worth fixing.",
    firstPilotNote: "After Pilot proof when simulation evidence backs a live change.",
    enterpriseFootnote: "Tuning from simulation evidence.",
  },
  "composite-alert-rules": {
    layerBadge: "Governance",
    headline: "Combine metrics with AND/OR before firing.",
    useWhen: "Use when one metric is not enough; add cooldown as needed.",
    firstPilotNote: "Composite rules after Pilot proof when AND/OR firing is in scope.",
    enterpriseFootnote: "AND/OR and cooldown configuration.",
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
      "See who acted, when, and why — filter when needed; download CSV when your role allows.",
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
    layerBadge: "Evidence trail",
    headline: "Decision traceability graph for the Claims Intake review package.",
    useWhen:
      "Walk the same milestones as the signed architecture snapshot and audit trail — as a connected decision trace.",
    firstPilotNote: null,
  },
  compare: {
    layerBadge: "Review change comparison",
    headline: "See what changed between two finalized architecture reviews.",
    useWhen:
      "Use when you need a structured package diff or an optional executive narrative after two packages are finalized.",
    firstPilotNote: null,
  },
  "governance-findings": {
    headline: "Review records, decisions, and monitoring actions tied to this review.",
    useWhen:
      "Scan dispositions alongside the governance approval — findings, recorded decisions, and follow-up monitors in one ledger.",
    firstPilotNote: null,
    enterpriseFootnote:
      "Portfolio operators still use review detail for deep inspection; governance approval remains the authoritative checkpoint.",
  },
  "policy-packs": {
    useWhen: "See which governance packs apply in this workspace and how they combine.",
    firstPilotNote: null,
  },
  "governance-workflow": {
    headline: "Governance approval completed for this review package.",
    useWhen:
      "Review the recorded approval path and how this package is approved as the governed architecture record for the next stage of review and implementation planning.",
    firstPilotNote: null,
    enterpriseFootnote:
      "This page records who reviewed the package, what approval was granted, and what monitoring remains.",
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
