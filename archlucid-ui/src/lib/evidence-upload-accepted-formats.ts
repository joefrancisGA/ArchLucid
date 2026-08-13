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
