export const SIGNED_RECORD_ARTIFACT_PAGE_TITLE = "Artifact preview";

export const SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE =
  "Inspect synthesized review outputs — metadata, in-shell preview, download, and sibling artifacts from the same sealed record.";

export const BUYER_SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE =
  "Preview a deliverable from the sealed review record and open related outputs.";

export const SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE_OPERATOR = SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE;

export function signedRecordArtifactPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? BUYER_SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE
    : SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE_OPERATOR;
}

export const SIGNED_RECORD_ARTIFACT_LAST_REFRESHED_PREFIX = "Last refreshed" as const;

export const SIGNED_RECORD_ARTIFACT_ACTION_REFRESH = "Refresh" as const;

export const SIGNED_RECORD_ARTIFACT_ACTION_REFRESHING = "Refreshing…" as const;

export const SIGNED_RECORD_ARTIFACT_SCOPE_DETAILS_TRIGGER = "About artifact preview" as const;

export const SIGNED_RECORD_ARTIFACT_SCOPE_OVERVIEW =
  "Artifacts are synthesized files linked to a finalized sealed review record. Use preview for orientation; download when you need the full file offline.";

export const SIGNED_RECORD_ARTIFACT_WHAT_IS_THIS_HEADING = "What this artifact is";

export const SIGNED_RECORD_ARTIFACT_SIBLINGS_HEADING = "Artifacts in this sealed record";
