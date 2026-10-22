import type { ErrorRecoveryContractPresentation } from "@/lib/error-recovery-contract-copy";
import { PROXY_MAX_MULTIPART_BODY_BYTES } from "@/lib/proxy-constants";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** Aligns with API `EvidenceBulkUploadMaxFiles` default (V1 GA). */
export const BULK_EVIDENCE_UPLOAD_MAX_FILES = 200;

/** Per-request multipart envelope cap (proxy + API). */
export const BULK_EVIDENCE_UPLOAD_MAX_BYTES = PROXY_MAX_MULTIPART_BODY_BYTES;

/** ZIP expansion cap per archive (API intake). */
export const BULK_EVIDENCE_UPLOAD_ZIP_MAX_ENTRIES = 1_000;

const maxMegabytes = Math.round(BULK_EVIDENCE_UPLOAD_MAX_BYTES / (1024 * 1024));

/** Fixed `en-US` grouping so helper copy reads the same on the server and in the browser. */
const zipMaxEntriesLabel = new Intl.NumberFormat("en-US").format(BULK_EVIDENCE_UPLOAD_ZIP_MAX_ENTRIES);

export const BULK_EVIDENCE_UPLOAD_HANDLING_HELPER =
  `Files attach to this architecture package in your current workspace. Accepted formats include PDF, DOCX, Markdown, text, JSON, YAML, and common images. Up to ${BULK_EVIDENCE_UPLOAD_MAX_FILES} files per upload (${maxMegabytes} MB total per request); ZIP archives count as one file and expand automatically (up to ${zipMaxEntriesLabel} entries each).`;

/** Shared Evidence upload section title (create-home + review detail capture surfaces). */
export const RUN_DETAIL_EVIDENCE_CAPTURE_SECTION_TITLE = "Add evidence" as const;

export const BULK_EVIDENCE_UPLOAD_HELP_LINKS = [
  { label: "Evidence intake help", href: inAppHelpHref("evidence-intake") },
  { label: "Data handling and tenant isolation", href: inAppHelpHref("data-handling") },
] as const;

export const BULK_EVIDENCE_UPLOAD_FAILURE_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "Evidence files could not be uploaded.",
  whatIsIntact: "Previously captured evidence on this architecture package is unchanged.",
  nextStep: "Retry the upload or adjust the file list, then upload again.",
};

export const BULK_EVIDENCE_UPLOAD_CANCEL_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "The evidence upload was canceled.",
  whatIsIntact: "Files uploaded before this attempt remain on the architecture package.",
  nextStep: "Review the submitted evidence inventory above, then upload again when ready.",
};

/** Per-file failure reason when the batch stops before this file is stored. */
export const BULK_EVIDENCE_UPLOAD_FILE_NOT_STORED_REASON = "Not stored";

/** Per-file failure reason for zero-byte files skipped during intake. */
export const BULK_EVIDENCE_UPLOAD_EMPTY_FILE_REASON = "Empty file (skipped)";
