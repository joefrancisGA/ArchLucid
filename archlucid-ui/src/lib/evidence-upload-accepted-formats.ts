export type EvidenceUploadAcceptedFormatRow = {
  readonly extension: string;
  readonly label: string;
};

/** File extensions accepted by {@link WizardEvidenceUploadZone} default `accept` attribute. */
export const EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".md",
  ".txt",
  ".json",
  ".yaml",
  ".yml",
  ".png",
  ".jpg",
  ".jpeg",
] as const;

export const EVIDENCE_UPLOAD_ACCEPT_EXTENSIONS_ATTR = EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS.join(",");

const EVIDENCE_UPLOAD_INLINE_LABEL_BY_EXTENSION: Record<
  (typeof EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS)[number],
  string
> = {
  ".pdf": "PDF",
  ".docx": "DOCX",
  ".md": "Markdown",
  ".txt": "text",
  ".json": "JSON",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".png": "PNG",
  ".jpg": "JPG",
  ".jpeg": "JPEG",
};

/** Comma-separated inline helper copy for accepted evidence upload formats. */
export const EVIDENCE_UPLOAD_ACCEPTED_FORMATS_INLINE_LIST = [
  ...new Set(
    EVIDENCE_UPLOAD_ACCEPTED_EXTENSIONS.map(
      (extension) => EVIDENCE_UPLOAD_INLINE_LABEL_BY_EXTENSION[extension],
    ),
  ),
].join(", ");

/** Prefix for evidence upload helper lines, e.g. "Accepted: PDF, DOCX, …". */
export const EVIDENCE_UPLOAD_ACCEPTED_FORMATS_ACCEPTED_PREFIX = `Accepted: ${EVIDENCE_UPLOAD_ACCEPTED_FORMATS_INLINE_LIST}`;

export const EVIDENCE_UPLOAD_ACCEPTED_FORMAT_ROWS: readonly EvidenceUploadAcceptedFormatRow[] = [
  { extension: ".pdf", label: "PDF" },
  { extension: ".docx", label: "Word (DOCX)" },
  { extension: ".md", label: "Markdown" },
  { extension: ".txt", label: "Plain text" },
  { extension: ".json", label: "JSON" },
  { extension: ".yaml", label: "YAML" },
  { extension: ".yml", label: "YAML" },
  { extension: ".png", label: "PNG image" },
  { extension: ".jpg", label: "JPEG image" },
  { extension: ".jpeg", label: "JPEG image" },
] as const;
