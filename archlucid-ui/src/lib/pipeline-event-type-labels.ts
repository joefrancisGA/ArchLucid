/**
 * Maps audit / pipeline timeline event codes to reviewer-facing labels.
 * Covers legacy short keys, dotted semantic keys, and canonical `com.archlucid.*` integration types.
 */
const PIPELINE_EVENT_TYPE_LABELS: Record<string, string> = {
  RunStarted: "Run started",
  RunCompleted: "Run completed",
  "finalize.run": "Manifest finalized",
  "run.finalized": "Run finalized",
  "context.snapshot.created": "Context captured",
  "graph.snapshot.created": "Architecture graph created",
  "findings.snapshot.created": "Findings generated",
  "manifest.committed": "Governed manifest committed",
  "artifact.bundle.created": "Artifacts bundled",
  "audit.pipeline.step": "Pipeline step recorded",
  Commit: "Changes committed",
  context_snapshot: "Context captured",
  graph_snapshot: "Architecture graph created",
  findings_snapshot: "Findings generated",

  // Canonical integration events (see ArchLucid.Core.Integration.IntegrationEventTypes)
  "com.archlucid.authority.run.completed": "Run finalized",
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

/** Title-cases the last segment of a dotted event id for unknown types (never raw `com.archlucid.*`). */
function humanizeUnknownPipelineEventType(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return "Event";
  }

  const parts = trimmed.split(".");

  const last = parts[parts.length - 1] ?? trimmed;

  const words = last.replace(/[-_]/g, " ").split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return trimmed;
  }

  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

/** Maps API timeline event codes to reviewer-facing labels (falls back to humanized code). */
export function pipelineEventTypeFriendlyLabel(eventType: string): string {
  const key = eventType.trim();

  const mapped = PIPELINE_EVENT_TYPE_LABELS[key];

  if (mapped !== undefined) {
    return mapped;
  }

  return humanizeUnknownPipelineEventType(key);
}
