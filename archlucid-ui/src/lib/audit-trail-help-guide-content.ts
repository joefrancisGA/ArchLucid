import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE_HEADING,
  AUDIT_TRAIL_HELP_CLAIM_HEADING_ID,
} from "@/lib/audit-trail-help-evidence-copy";
import {
  AUDIT_TRAIL_OPERATOR_TABLE_COLUMN_LABELS,
  AUDIT_TRAIL_PAGE_SUBTITLE_BUYER,
  AUDIT_TRAIL_PAGE_SUBTITLE_OPERATOR,
} from "@/lib/audit-trail-page-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const AUDIT_TRAIL_HELP_CANONICAL_PATH = "/help/audit-trail" as const;

export const AUDIT_TRAIL_HELP_PAGE_TITLE = "Audit trail";

export const AUDIT_TRAIL_HELP_PAGE_SUBTITLE =
  "Immutable audit events, correlation identifiers, and buyer-safe export posture.";

export const AUDIT_TRAIL_HELP_PAGE_SUBTITLE_BUYER = AUDIT_TRAIL_PAGE_SUBTITLE_BUYER;

export const AUDIT_TRAIL_HELP_PAGE_SUBTITLE_OPERATOR = AUDIT_TRAIL_PAGE_SUBTITLE_OPERATOR;

export function auditTrailHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? AUDIT_TRAIL_HELP_PAGE_SUBTITLE_BUYER : AUDIT_TRAIL_HELP_PAGE_SUBTITLE_OPERATOR;
}

/** From `AUDIT_EVENT_MODEL.md` front matter — buyer-facing document status. */
export const AUDIT_TRAIL_HELP_DOCUMENT_STATUS_LABEL = "Current" as const;

export const AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_LABEL = "Data handling" as const;

export const AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_HREF = inAppHelpHref("data-handling", "audit-trail");

export const AUDIT_TRAIL_HELP_ACTION_PANEL_TITLE = "Related follow-ups" as const;

export const AUDIT_TRAIL_HELP_ACTION_PANEL_INTRO =
  "Use these links when audit trail vocabulary turns into live activity, approval decisions, or assurance materials.";

export const AUDIT_TRAIL_HELP_OVERVIEW =
  "The audit trail is the append-only ledger of authenticated actions across architecture reviews, approval, decisions, and exports. It answers who acted, when, and in which workspace scope — separate from findings or application diagnostics.";

export const AUDIT_TRAIL_HELP_PRIMARY_ACTIONS = {
  openAuditTrail: {
    label: "Open audit trail",
    href: GOVERNANCE_AUDIT_PATH,
  },
  governanceApproval: {
    label: "Approval",
    href: "/help/governance-approval",
  },
  securityTrust: {
    label: "Security and trust",
    href: "/help/security-trust",
  },
} as const;

export const AUDIT_TRAIL_HELP_WHAT_IS_BODY =
  "When an authorized user finalizes an architecture review, records approval, updates evidence, or exports a diligence bundle, ArchLucid appends an audit trail entry with actor identity, action type, timestamp, and correlation identifiers. Entries stay linked to the review so auditors can reconstruct accountability without opening every finding or finalized review record separately.";

export type AuditTrailHelpAnatomyField = {
  readonly label: string;
  readonly description: string;
};

const AUDIT_TRAIL_HELP_ANATOMY_DESCRIPTIONS: Readonly<
  Record<(typeof AUDIT_TRAIL_OPERATOR_TABLE_COLUMN_LABELS)[number], string>
> = {
  Occurred: "When the action occurred in UTC.",
  Event: "What changed — for example submission, approval, export, or evidence update.",
  Actor: "The person or service identity that performed the action.",
  Review: "The architecture review or finalized review record when the action is review-scoped.",
  Correlation: "Optional identifier linking related operations for forensics.",
  Payload:
    "Structured action outcome when shown. Tenant, workspace, and project scope appear as row context rather than a separate column.",
};

export const AUDIT_TRAIL_HELP_ANATOMY_FIELDS: readonly AuditTrailHelpAnatomyField[] =
  AUDIT_TRAIL_OPERATOR_TABLE_COLUMN_LABELS.map((label) => ({
    label,
    description: AUDIT_TRAIL_HELP_ANATOMY_DESCRIPTIONS[label],
  }));

export const AUDIT_TRAIL_HELP_IMMUTABILITY_TITLE = "Immutability and export posture";

export const AUDIT_TRAIL_HELP_IMMUTABILITY_INTRO =
  "Audit trail rows are append-only under the application identity. Procurement reviewers should pair each immutability statement below with linked guidance — this help topic orients buyers; it is not itself a full audit export.";

export const AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT =
  "Append-only rows are enforced by a database-level deny on update and delete for the application role.";

export const AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT_ANCHOR = "immutability-enforcement" as const;

export type AuditTrailHelpImmutabilityClaim = {
  readonly claim: string;
  readonly relatedGuidanceLabel: string;
  readonly relatedGuidanceHref: string;
};

export const AUDIT_TRAIL_HELP_IMMUTABILITY_CLAIMS: readonly AuditTrailHelpImmutabilityClaim[] = [
  {
    claim:
      "Application roles append audit trail entries only; they cannot silently rewrite or delete prior rows through normal product APIs.",
    relatedGuidanceLabel: "Security and trust center",
    relatedGuidanceHref: inAppHelpHref("security-trust"),
  },
  {
    claim:
      "Hot, warm, and cold retention guidance defines how interactive query windows, bulk exports, and long-term blob copies should be operated.",
    relatedGuidanceLabel: "Data handling and retention",
    relatedGuidanceHref: inAppHelpHref("data-handling"),
  },
  {
    claim:
      "Diligence exports can apply buyer-configurable redaction profiles so sensitive payloads stay out of shared proof packets.",
    relatedGuidanceLabel: "Procurement FAQ",
    relatedGuidanceHref: inAppHelpHref("procurement"),
  },
  {
    claim:
      "Authorized users can export CSV or JSON samples from the live audit trail surface for workspace-scoped review.",
    relatedGuidanceLabel: "Open audit trail",
    relatedGuidanceHref: GOVERNANCE_AUDIT_PATH,
  },
] as const;

export const AUDIT_TRAIL_HELP_EVIDENCE_TRAIL_INTRO =
  "The audit trail is one layer of the broader evidence trail for a review. Together they show accountability and reasoning:";

export const AUDIT_TRAIL_HELP_EVIDENCE_TRAIL_ITEMS = [
  "Input artifacts and evidence trail citations explain what was reviewed.",
  "Findings and decisions capture architecture risk and approval.",
  "Audit trail entries record authenticated actions — who submitted, approved, exported, or changed evidence.",
  "The finalized review record binds the committed architecture review state.",
] as const;

export type AuditTrailHelpRoleGuidance = {
  readonly role: string;
  readonly guidance: string;
};

export const AUDIT_TRAIL_HELP_ROLE_GUIDANCE: readonly AuditTrailHelpRoleGuidance[] = [
  {
    role: "Solution architect",
    guidance:
      "Filter audit trail activity on a review to confirm submissions, evidence updates, and export requests before approval handoff.",
  },
  {
    role: "Approval lead",
    guidance:
      "Trace approval, rejection, and release actions alongside resolve outcome history and decision register entries.",
  },
  {
    role: "Security reviewer",
    guidance:
      "Correlate audit trail exports with trust-center materials, retention posture, and procurement FAQ answers.",
  },
  {
    role: "Sponsor or sponsor",
    guidance:
      "Review material exports and finalization events when validating diligence bundles for sign-off.",
  },
] as const;

export const AUDIT_TRAIL_HELP_LIVE_VS_HELP_BODY =
  "This page explains audit trail concepts and immutability posture. Open audit trail from the header or approval navigation when you need searchable, filterable events and CSV export from your workspace.";

/** TB-1250 / TB-1387: buyer audit trail help must not deep-link eng API contracts in primary copy. */
export const AUDIT_TRAIL_HELP_RELATED_PRODUCT_DOCS = {
  label: "Approval",
  href: inAppHelpHref("governance-approval"),
} as const;

export const AUDIT_TRAIL_HELP_TECHNICAL_REFERENCE_INTRO =
  "Engineering reference for automation, integrations, and support. Customer sections above stay product-oriented; expand this section for database fields, API routes, and implementation notes.";

export const AUDIT_TRAIL_HELP_TECHNICAL_REFERENCE_SECTIONS = [
  {
    title: "Durable SQL audit channel",
    lines: [
      "dbo.AuditEvents — authoritative tenant-scoped audit rows.",
      "GET /v1/audit — paginated list (newest first).",
      "GET /v1/audit/search — filtered search including correlationId.",
      "GET /v1/audit/export — JSON or CSV bulk export (90-day UTC window per request).",
    ],
  },
  {
    title: "Representative event fields",
    lines: [
      "EventId, OccurredUtc, EventType, ActorUserId, ActorUserName.",
      "TenantId, WorkspaceId, ProjectId — scope triple always set.",
      "RunId, ManifestId, ArtifactId — optional review linkage.",
      "DataJson — event-type payload; redacted per export profile when configured.",
      "CorrelationId — cross-request forensics token.",
    ],
  },
  {
    title: "Immutability enforcement",
    anchorId: AUDIT_TRAIL_HELP_APPEND_ONLY_ENFORCEMENT_ANCHOR,
    lines: [
      "IAuditRepository.AppendAsync — sole application write path.",
      "051_AuditEvents_DenyUpdateDelete.sql — DENY UPDATE/DELETE for ArchLucidApp role.",
      "Baseline mutation log and PlatformAuditEvents — separate channels; see AUDIT_EVENT_MODEL.md.",
    ],
  },
] as const;


export const AUDIT_TRAIL_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-the-audit-trail-is", title: "What the audit trail is" },
  { level: 2, id: "anatomy-of-an-entry", title: "Anatomy of an audit trail entry" },
  { level: 2, id: "immutability-and-export", title: "Immutability and export posture" },
  { level: 2, id: "evidence-trail-connection", title: "Connection to the evidence trail" },
  { level: 2, id: "live-surface-vs-help", title: "Live audit trail vs this help topic" },
  { level: 2, id: "role-guidance", title: "Role guidance" },
  { level: 2, id: AUDIT_TRAIL_HELP_CLAIM_HEADING_ID, title: AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE_HEADING },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
  { level: 2, id: "technical-reference", title: "Technical reference" },
];

/** Drift guard: claim band owns diligence limits; overview and steps stay affirmative. */
export const AUDIT_TRAIL_HELP_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["sources package", "sealed-review diligence"],
  claimMustNotContain: ["sources package", "sealed-review diligence"],
} as const;
