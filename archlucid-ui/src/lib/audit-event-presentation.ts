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
    return "Event type was not stored.";
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
      return "Review generated";

    case "ManifestFinalized":
      return "Review finalized";

    case "ManifestViewed":
      return "Review viewed";

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
      return "Approval requested";

    case "SponsorPreliminaryArchitectureShared":
      return "Preliminary architecture shared with sponsor";

    case "Workspace.ModelExecutionProfileUpdated":
      return "Workspace model execution profile updated";

    case "Workspace.ModelExecutionProfileOverrideCleared":
      return "Workspace model execution profile override cleared";

    case "Run.ModelExecutionProfileOverrideApplied":
      return "Review model execution profile override applied";

    case "OperatorInferredConnection.Confirmed":
      return "Inferred connection confirmed";

    case "OperatorInferredConnection.Dismissed":
      return "Inferred connection dismissed";

    default:
      return `Event type has no reviewer label: ${key}`;
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

/** Unknown audit codes — reviewer label is not mapped in the UI catalog. */
export function humanizeUnknownAuditEventType(raw: string): string {
  return `Event type has no reviewer label: ${raw}`;
}
