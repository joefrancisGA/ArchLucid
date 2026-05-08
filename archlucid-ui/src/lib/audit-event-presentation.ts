/**
 * Mirrors {@link ArchLucid.Contracts.Audit.AuditEventPresentation} and {@link ReviewAuditLifecycleStage} so audit /
 * activity timelines stay aligned with server Contracts without duplicating ad hoc strings in the UI layer.
 */

export const ReviewAuditLifecycleStage = {
  ReviewStarted: 0,
  ContextCaptured: 1,
  GraphCreated: 2,
  FindingsCaptured: 3,
  ManifestFinalized: 4,
  ArtifactsBundled: 5,
  GovernanceHandoff: 6,
  Other: 99,
} as const;

export type ReviewAuditLifecycleStageValue =
  (typeof ReviewAuditLifecycleStage)[keyof typeof ReviewAuditLifecycleStage];

/** Buyer-facing title for durable audit type codes (unknown codes are humanized like the C# helper). */
export function auditEventFriendlyTitle(eventType: string): string {
  const key = eventType.trim();

  if (key.length === 0) {
    return "Event";
  }

  switch (key) {
    case "RunStarted":
      return "Review started";

    case "RunSubmitted":
      return "Review submitted";

    case "RunCompleted":
      return "Review completed";

    case "Request.Created":
      return "Architecture request captured";

    case "ManifestGenerated":
      return "Manifest generated";

    case "ManifestFinalized":
      return "Manifest finalized";

    case "ManifestViewed":
      return "Manifest viewed";

    case "ReviewTrailAccessed":
      return "Review trail accessed";

    case "ProvenanceAccessed":
      return "Evidence graph accessed";

    case "FindingsListAccessed":
      return "Findings reviewed";

    case "FindingsSnapshotSealed":
      return "Findings captured";

    case "ArtifactsGenerated":
      return "Artifacts bundled";

    case "GovernanceApprovalRequested":
      return "Governance approval requested";

    default:
      return humanizeUnknownAuditEventType(key);
  }
}

/** Coarse lifecycle bucket for grouping Activity / Audit timelines (matches Contracts enum ordinals). */
export function auditEventLifecycleStage(eventType: string): ReviewAuditLifecycleStageValue {
  const key = eventType.trim();

  switch (key) {
    case "RunStarted":
    case "RunSubmitted":
      return ReviewAuditLifecycleStage.ReviewStarted;

    case "Request.Created":
      return ReviewAuditLifecycleStage.ContextCaptured;

    case "ReviewTrailAccessed":
    case "ProvenanceAccessed":
      return ReviewAuditLifecycleStage.GraphCreated;

    case "FindingsListAccessed":
    case "FindingsSnapshotSealed":
      return ReviewAuditLifecycleStage.FindingsCaptured;

    case "ManifestGenerated":
    case "ManifestFinalized":
    case "ManifestViewed":
      return ReviewAuditLifecycleStage.ManifestFinalized;

    case "ArtifactsGenerated":
      return ReviewAuditLifecycleStage.ArtifactsBundled;

    case "GovernanceApprovalRequested":
      return ReviewAuditLifecycleStage.GovernanceHandoff;

    default:
      return ReviewAuditLifecycleStage.Other;
  }
}

/** Humanize unknown audit codes — mirrors Contracts `HumanizeUnknown` (last dotted segment, word-split, title case). */
export function humanizeUnknownAuditEventType(raw: string): string {
  const parts = raw.split(".").filter((p) => p.trim().length > 0);
  const last = parts.length > 0 ? parts[parts.length - 1] : raw;
  const words = last.replace(/-/g, " ").replace(/_/g, " ").split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) {
    return raw;
  }

  return words
    .map((w) => (w.length === 0 ? "" : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}
