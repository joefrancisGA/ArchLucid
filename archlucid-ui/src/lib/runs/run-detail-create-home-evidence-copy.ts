export const RUN_DETAIL_CREATE_HOME_EVIDENCE_ORIENTATION_LEAD =
  "Attach supporting files and architecture context before you finalize this architecture package. Uploaded captures appear in the inventory below; findings cite them after analysis." as const;

export const RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_HEADING = "Uploaded captures" as const;

export const RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_HELPER =
  "Files stored with this review. Refreshing the page keeps the list when files were uploaded to the server." as const;

export const RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_EMPTY_TITLE = "No files uploaded yet" as const;

export const RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_CATALOG_STATUS_NOT_STORED_TITLE =
  "Upload catalog status was not stored." as const;

export const RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_CATALOG_UNAVAILABLE_TITLE =
  "Upload catalog was not available." as const;

export const RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_EMPTY_DESCRIPTION =
  "Upload supporting documents below. Stored files appear here after a successful upload." as const;

export const RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_CROSS_LINK_HELPER =
  "A generated diagram is stored for this package. It is not an uploaded capture. Open Diagram to review the sketch before you upload more files." as const;

export const RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_NOT_STORED_HELPER =
  "An architecture diagram was not stored for this package." as const;

export const RUN_DETAIL_CREATE_HOME_EVIDENCE_GRAPH_SNAPSHOT_NOT_STORED_HELPER =
  "Graph snapshot status was not stored for this package." as const;

export function resolveRunDetailCreateHomeEvidenceDiagramCrossLinkHelper(
  hasGraphSnapshot: boolean | null | undefined,
): string {
  if (hasGraphSnapshot === true) {
    return RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_CROSS_LINK_HELPER;
  }

  if (hasGraphSnapshot === false) {
    return RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_NOT_STORED_HELPER;
  }

  return RUN_DETAIL_CREATE_HOME_EVIDENCE_GRAPH_SNAPSHOT_NOT_STORED_HELPER;
}

export const RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_CTA_LABEL = "Open diagram tab" as const;
