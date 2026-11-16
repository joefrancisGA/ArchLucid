export const SECURENOW_PARTIAL_CAPTURE_RANKED_PATHS_LINE =
  "The latest capture completed with gaps. Ranked paths may be incomplete for this snapshot until a fuller capture succeeds." as const;

/** Collection setup can read “ready” while the latest snapshot still has capture gaps. */
export const SECURENOW_COLLECTION_READY_PARTIAL_CAPTURE_LINE =
  "Collection setup is marked ready, but the latest capture completed with gaps — ranked paths and findings may still be incomplete." as const;