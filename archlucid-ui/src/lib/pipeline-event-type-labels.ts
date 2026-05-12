import { auditEventFriendlyTitle } from "@/lib/audit-event-presentation";

/**
 * Maps audit / pipeline timeline event codes to reviewer-facing labels.
 * Covers legacy short keys, dotted semantic keys, and canonical `com.archlucid.*` integration types.
 */
const PIPELINE_EVENT_TYPE_LABELS: Record<string, string> = {
  RunStarted: "Review started",
  RunCompleted: "Review completed",
  RunSubmitted: "Review submitted",
  ManifestGenerated: "Manifest generated",
  ManifestFinalized: "Manifest finalized",
  FindingsSnapshotSealed: "Findings captured",
  ArtifactsGenerated: "Deliverables ready",
  GovernanceApprovalRequested: "Governance approval requested",
  "finalize.run": "Manifest finalized",
  "run.finalized": "Review finalized",
  "context.snapshot.created": "Context captured",
  "graph.snapshot.created": "Evidence graph created",
  "findings.snapshot.created": "Findings generated",
  "manifest.committed": "Architecture package approved",
  "artifact.bundle.created": "Deliverables ready",
  "audit.pipeline.step": "Pipeline step recorded",
  Commit: "Review submitted",
  context_snapshot: "Context captured",
  graph_snapshot: "Evidence graph created",
  findings_snapshot: "Findings generated",

  // Canonical integration events (see ArchLucid.Core.Integration.IntegrationEventTypes)
  "com.archlucid.authority.run.completed": "Review finalized",
  "com.archlucid.manifest.finalized.v1": "Manifest finalized",
  "com.archlucid.governance.approval.submitted": "Governance approval requested",
  "com.archlucid.governance.promotion.activated": "Governance promotion activated",
  "com.archlucid.alert.fired": "Alert fired",
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

/** One-line “why this milestone matters” for buyer-polished audit cards (falls back to generic). */
const PIPELINE_EVENT_BUYER_SUBTITLE: Record<string, string> = {
  RunStarted: "Creates the review record and starts the evidence capture timeline.",
  RunCompleted: "Closes the run with a durable outcome snapshot for governance and audit.",
  RunSubmitted: "Hands off the review package for formal review or governance steps.",
  ManifestGenerated: "Produces the versioned architecture manifest backing decisions and exports.",
  ManifestFinalized:
    "Seals the reviewed manifest as the authoritative record for decisions, deliverables, and audit.",
  FindingsSnapshotSealed: "Freezes finding text and severities for traceability and remediation tickets.",
  ArtifactsGenerated: "Materializes sponsor and compliance deliverables attached to the manifest.",
  GovernanceApprovalRequested:
    "Creates an auditable governance checkpoint before any governed downstream handoff.",
  "finalize.run": "Seals the reviewed manifest as the authoritative record for decisions, deliverables, and audit.",
  "run.finalized": "Closes the run with a durable outcome snapshot for governance and audit.",
  "context.snapshot.created": "Captures the ingested context used to justify findings and graph evidence.",
  "graph.snapshot.created": "Persists the architecture relationship graph used in the evidence trail.",
  "findings.snapshot.created": "Persists generated findings before final manifest packaging.",
  "manifest.committed": "Commits the reviewed manifest as the contract for deliverables and audits.",
  "artifact.bundle.created": "Bundles downloadable outputs for sponsor and audit audiences.",
  Commit: "Hands off the review package for formal review or governance steps.",
  context_snapshot: "Captures the ingested context used to justify findings and graph evidence.",
  graph_snapshot: "Persists the architecture relationship graph used in the evidence trail.",
  findings_snapshot: "Persists generated findings before final manifest packaging.",
  "com.archlucid.authority.run.completed": "Closes the run with a durable outcome snapshot for governance and audit.",
  "com.archlucid.manifest.finalized.v1":
    "Seals the reviewed manifest as the authoritative record for decisions, deliverables, and audit.",
  "com.archlucid.governance.approval.submitted":
    "Creates an auditable governance checkpoint before any governed downstream handoff.",
  "com.archlucid.governance.promotion.activated":
    "Records that an approved package was authorized to advance within the governed change boundary.",
};

export function pipelineEventTypeBuyerMilestoneSubtitle(eventType: string): string {
  const key = eventType.trim();
  const mapped = PIPELINE_EVENT_BUYER_SUBTITLE[key];

  if (mapped !== undefined) {
    return mapped;
  }

  return "Recorded on the authoritative audit trail for this review.";
}
