import { auditEventFriendlyTitle } from "@/lib/audit-event-presentation";

/**
 * Maps audit / pipeline timeline event codes to reviewer-facing labels.
 * Covers legacy short keys, dotted semantic keys, and canonical `com.archlucid.*` integration types.
 */
const PIPELINE_EVENT_TYPE_LABELS: Record<string, string> = {
  RunStarted: "Review started",
  RunCompleted: "Review completed",
  RunSubmitted: "Review submitted",
  ManifestGenerated: "Review generated",
  ManifestFinalized: "Review finalized",
  FindingsSnapshotSealed: "Findings captured",
  ArtifactsGenerated: "Deliverables ready",
  GovernanceApprovalRequested: "Governance approval requested",
  "finalize.run": "Review finalized",
  "run.finalized": "Review finalized",
  "context.snapshot.created": "Source context captured",
  "graph.snapshot.created": "Evidence graph created",
  "findings.snapshot.created": "Findings generated",
  "manifest.committed": "Architecture review approved",
  "artifact.bundle.created": "Deliverables ready",
  "audit.pipeline.step": "Pipeline step recorded",
  Commit: "Review submitted",
  context_snapshot: "Source context captured",
  graph_snapshot: "Evidence graph created",
  findings_snapshot: "Findings generated",

  // Canonical integration events (see ArchLucid.Core.Integration.IntegrationEventTypes)
  "com.archlucid.authority.run.completed": "Review finalized",
  "com.archlucid.authority.run.failed": "Review failed",
  "com.archlucid.authority.run.quality-gate.rejected": "Quality gate rejected",
  "com.archlucid.findings.high-severity.captured.v1": "High-severity findings captured",
  "com.archlucid.manifest.finalized.v1": "Review finalized",
  "com.archlucid.governance.approval.submitted": "Governance approval requested",
  "com.archlucid.governance.approval.approved": "Governance approval approved",
  "com.archlucid.governance.approval.rejected": "Governance approval rejected",
  "com.archlucid.governance.approval.recorded": "Governance approval recorded",
  "com.archlucid.governance.promotion.activated": "Governance promotion activated",
  "com.archlucid.governance.policy-pack.published.v1": "Policy pack activated",
  "com.archlucid.alert.fired": "Alert fired",
  "com.archlucid.alert.acknowledged": "Alert acknowledged",
  "com.archlucid.alert.resolved": "Alert resolved",
  "com.archlucid.advisory.scan.completed": "Advisory scan completed",
  "com.archlucid.compliance.drift.escalated": "Compliance drift escalated",
  "com.archlucid.seat.reservation.released": "Trial seat released",
  "com.archlucid.notifications.trial-lifecycle-email.v1": "Trial lifecycle email sent",
  "com.archlucid.billing.marketplace.webhook.received.v1": "Marketplace webhook received",
};

/** Maps API timeline event codes to reviewer-facing labels (falls back to humanized code). */
export function pipelineEventTypeFriendlyLabel(eventType: string): string {
  const key = eventType.trim();

  const mapped = PIPELINE_EVENT_TYPE_LABELS[key];

  if (mapped !== undefined) {
    return mapped;
  }

  return auditEventFriendlyTitle(key);
}

/** One-line â€œwhy this milestone mattersâ€ for buyer-polished audit cards (falls back to generic). */
const PIPELINE_EVENT_BUYER_SUBTITLE: Record<string, string> = {
  RunStarted: "Creates the review record and starts the evidence capture timeline.",
  RunCompleted: "Closes the review with a durable outcome snapshot for governance and audit.",
  RunSubmitted: "Hands off the review for formal review or governance steps.",
  ManifestGenerated: "Produces the versioned review backing decisions and exports.",
  ManifestFinalized:
    "Locks the finalized review as the official version used for approvals, exports, and audit history.",
  FindingsSnapshotSealed: "Freezes finding text and severities for traceability and remediation tickets.",
  ArtifactsGenerated: "Materializes sponsor and compliance deliverables attached to the review.",
  GovernanceApprovalRequested:
    "Creates an auditable governance checkpoint before any governed downstream handoff.",
  "finalize.run": "Locks the finalized review as the official version used for approvals, exports, and audit history.",
  "run.finalized": "Closes the review with a durable outcome snapshot for governance and audit.",
  "context.snapshot.created": "Captures the ingested context used to justify findings and graph evidence.",
  "graph.snapshot.created": "Persists the architecture relationship graph used in the evidence trail.",
  "findings.snapshot.created": "Persists generated findings before final review packaging.",
  "manifest.committed": "Commits the sealed review record as the contract for deliverables and audits.",
  "artifact.bundle.created": "Bundles downloadable outputs for sponsor and audit audiences.",
  Commit: "Hands off the review for formal review or governance steps.",
  context_snapshot: "Captures the ingested context used to justify findings and graph evidence.",
  graph_snapshot: "Persists the architecture relationship graph used in the evidence trail.",
  findings_snapshot: "Persists generated findings before final review packaging.",
  "com.archlucid.authority.run.completed": "Closes the review with a durable outcome snapshot for governance and audit.",
  "com.archlucid.manifest.finalized.v1":
    "Finalizes the sealed review record as the authoritative record for decisions, deliverables, and audit.",
  "com.archlucid.governance.approval.submitted":
    "Creates an auditable governance checkpoint before any governed downstream handoff.",
  "com.archlucid.governance.approval.recorded":
    "Records that the required governance approval sequence completed for this finalized signed review.",
  "com.archlucid.governance.promotion.activated":
    "Records that an approved review was authorized to advance within the governed change boundary.",
};

export function pipelineEventTypeBuyerMilestoneSubtitle(eventType: string): string {
  const key = eventType.trim();
  const mapped = PIPELINE_EVENT_BUYER_SUBTITLE[key];

  if (mapped !== undefined) {
    return mapped;
  }

  return "Recorded on the authoritative audit trail for this review.";
}
