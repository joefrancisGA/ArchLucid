/** Finalize (commit) anchors evidence on the sealed manifest; collateral exports stay gated until then. */
export const REVIEW_COMMIT_EVIDENCE_BEFORE_SEAL_LINE =
  "Finalize stores evidence anchors on the sealed manifest. Deliverable downloads stay blocked until commit succeeds." as const;

export const REVIEW_SHARE_PACKAGE_COMMIT_DISABLED_LINE =
  "Share review is disabled until the review is finalized — finalize records evidence on the sealed manifest first." as const;