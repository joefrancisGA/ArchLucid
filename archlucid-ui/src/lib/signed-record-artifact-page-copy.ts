export const SIGNED_RECORD_ARTIFACT_PRIMARY_CONTENT_ID =
  "governance-signed-record-artifact-primary-content" as const;

export const SIGNED_RECORD_ARTIFACT_SKIP_LINK_LABEL = "Skip to artifact preview" as const;

/** Buyer-facing copy for `/governance/sealed-records/[manifestId]/artifacts/[artifactId]` (GAR). */
export const SIGNED_RECORD_ARTIFACT_PAGE_LEAD =
  "Preview one deliverable from a finalized review record — review metadata here, then open Preview or download the full file.";

export const SIGNED_RECORD_ARTIFACT_BUYER_START_HERE_HELPER =
  "Use sibling artifacts below to compare outputs from the same finalized review record, or return to the record detail for the full package.";

export const SIGNED_RECORD_ARTIFACT_LOAD_ERROR =
  "Could not load this artifact preview. Try again in a moment." as const;

export const SIGNED_RECORD_ARTIFACT_LOAD_ERROR_RETRY_LABEL = "Try again" as const;

export const SIGNED_RECORD_ARTIFACT_LOADING_STATUS = "Loading artifact preview…" as const;

export const SIGNED_RECORD_ARTIFACT_PAGE_TITLE = "Artifact preview";

export const SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE =
  "Inspect synthesized review outputs — metadata, in-shell preview, download, and sibling artifacts from the same finalized review record.";

export const BUYER_SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE =
  "Preview a deliverable from the finalized review record and open related outputs.";

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
  "Artifacts are synthesized files linked to a finalized review record. Use preview for orientation; download when you need the full file offline.";

export const SIGNED_RECORD_ARTIFACT_WHAT_IS_THIS_HEADING = "What this artifact is";

export const SIGNED_RECORD_ARTIFACT_SIBLINGS_HEADING = "Artifacts in this finalized review record";

export const SIGNED_RECORD_ARTIFACT_CONTENT_HASH_LABEL = "Content hash";

export const SIGNED_RECORD_ARTIFACT_GENERATED_LABEL = "Generated";

export const SIGNED_RECORD_ARTIFACT_PREVIEW_RETRY = "Retry preview load";

export const SIGNED_RECORD_ARTIFACT_DOWNLOAD_UNAVAILABLE =
  "Download is unavailable until the artifact descriptor loads successfully.";

export const SIGNED_RECORD_ARTIFACT_NOT_FOUND_HEADING = "Artifact not found";

export const SIGNED_RECORD_ARTIFACT_NOT_FOUND_BODY =
  "This artifact is not on the finalized review record, or the link is outdated. Return to the finalized review record or list and open Preview again.";

export const SIGNED_RECORD_ARTIFACT_DESCRIPTOR_ERROR_HEADING = "Artifact metadata could not be loaded";

export const SIGNED_RECORD_ARTIFACT_DESCRIPTOR_ERROR_BODY =
  "Try refresh once. If the problem continues, open the finalized review record from review detail instead of a pasted link.";
